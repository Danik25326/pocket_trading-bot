import asyncio
import logging
import os
from datetime import datetime, timedelta
import pytz
import random
from config import Config
from pocket_client import PocketOptionClient
from groq_analyzer import GroqAnalyzer
from data_handler import DataHandler

logger = logging.getLogger("signal_bot")

class SignalGenerator:
    def __init__(self):
        self.pocket_client = PocketOptionClient()
        self.analyzer = GroqAnalyzer()
        self.data_handler = DataHandler()
        self.signals = []
        
        # Обмеження для економії токенів
        self.MAX_SIGNALS_PER_GENERATION = 3
        self.REQUEST_DELAY = 2  # секунд між запитами

    async def generate_signal(self, asset):
        """Генерація одного сигналу з фіксованою затримкою входу 2 хвилини"""
        try:
            logger.info(f"📈 Аналіз активу: {asset}")
            
            if not hasattr(self.pocket_client, 'client') or not self.pocket_client.client:
                logger.error("❌ PocketOptionClient не ініціалізований")
                return None
            
            logger.info(f"📊 Запит свічок для {asset}...")
            candles = await self.pocket_client.get_candles(
                asset=asset,
                timeframe=Config.TIMEFRAMES,
                count=50
            )
            
            if not candles or len(candles) == 0:
                logger.error(f"❌ Не вдалося отримати свічки для {asset}")
                return None

            logger.info(f"✅ Отримано {len(candles)} свічок для {asset}")
            
            # Перевірка актуальності даних
            if hasattr(candles[-1], 'timestamp'):
                last_candle_time = candles[-1].timestamp
                current_time = Config.get_kyiv_time()
                
                if last_candle_time.tzinfo is None:
                    last_candle_time = pytz.UTC.localize(last_candle_time)
                
                last_candle_time_kyiv = last_candle_time.astimezone(Config.KYIV_TZ)
                time_diff = (current_time - last_candle_time_kyiv).total_seconds()
                
                if time_diff > 300:
                    logger.warning(f"⚠️ Остання свічка застаріла: {time_diff:.0f} сек тому")
                else:
                    logger.info(f"🕐 Остання свічка актуальна: {time_diff:.0f} сек тому")
            
            logger.info(f"🧠 Аналіз через GPT OSS 120B для {asset}...")
            signal = self.analyzer.analyze_market(asset, candles, language=Config.LANGUAGE)

            if signal:
                confidence = signal.get('confidence', 0)
                logger.info(f"📝 AI повернув сигнал для {asset}: confidence={confidence*100:.1f}%")
                
                if confidence >= Config.MIN_CONFIDENCE:
                    duration = signal.get('duration', 2)
                    if duration > Config.MAX_DURATION:
                        logger.warning(f"⚠️ Сигнал для {asset} має завелику тривалість: {duration} > {Config.MAX_DURATION}")
                        signal['duration'] = Config.MAX_DURATION
                    
                    now_kyiv = Config.get_kyiv_time()
                    
                    # Фіксована затримка 2 хвилини для входу
                    delay_minutes = 2
                    entry_time_dt = now_kyiv + timedelta(minutes=2)  # Чітко через 2 хвилини
                    signal['entry_time'] = entry_time_dt.strftime('%H:%M')
                    signal['entry_delay'] = 2
                    
                    signal['generated_at'] = now_kyiv.isoformat()
                    signal['generated_at_utc'] = datetime.utcnow().isoformat() + 'Z'
                    signal['asset'] = asset
                    signal['id'] = f"{asset}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                    
                    # Додаємо інформацію про волатильність
                    if 'volatility' not in signal:
                        signal['volatility'] = 0.0
                    
                    logger.info(f"✅ Створено сигнал для {asset}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                    logger.info(f"   📅 Вхід через {delay_minutes} хв о {signal['entry_time']}, Тривалість: {signal['duration']} хв")
                    return signal
                else:
                    logger.warning(f"⚠️ Сигнал для {asset} має низьку впевненість: {confidence*100:.1f}% < {Config.MIN_CONFIDENCE*100}%")
            else:
                logger.warning(f"⚠️ AI не повернув сигнал для {asset}")
                    
        except Exception as e:
            logger.error(f"❌ Помилка генерації сигналу для {asset}: {e}")
            import traceback
            logger.error(f"📋 Трейс: {traceback.format_exc()}")

        return None

    async def generate_all_signals(self):
        """Генерація сигналів для всіх активів з обмеженням для економії токенів"""
        logger.info("=" * 60)
        logger.info(f"🚀 ПОЧАТОК ГЕНЕРАЦІЇ СИГНАЛІВ")
        logger.info(f"🌐 Мова: {Config.LANGUAGE}")
        logger.info(f"🕐 Час: {Config.get_kyiv_time().strftime('%Y-%m-%d %H:%M:%S')} (Київ)")
        logger.info(f"💰 Обмеження: {self.MAX_SIGNALS_PER_GENERATION} сигналів для економії токенів")
        logger.info("=" * 60)

        try:
            logger.info(f"⚙️ Конфігурація:")
            logger.info(f"  - Демо режим: {Config.POCKET_DEMO}")
            logger.info(f"  - Активи: {Config.ASSETS}")
            logger.info(f"  - Таймфрейм: {Config.TIMEFRAMES} сек ({Config.TIMEFRAMES/60} хв)")
            logger.info(f"  - Мін. впевненість: {Config.MIN_CONFIDENCE*100}%")
            logger.info(f"  - Макс. тривалість: {Config.MAX_DURATION} хв")
            logger.info(f"  - Модель AI: {Config.GROQ_MODEL}")
            logger.info(f"  - Мова: {Config.LANGUAGE}")
            logger.info(f"  - Часовий пояс: Київ (UTC+2)")
            logger.info(f"  - Затримка входу: 2 хвилини")
            
            # ⚠️ ВИДАЛЕНО ВСІ ПЕРЕВІРКИ ЧАСУ! Генеруємо завжди
            logger.info("🔗 Підключення до PocketOption...")
            logger.info(f"   Режим: {'DEMO' if Config.POCKET_DEMO else 'REAL'}")
            
            connection_result = await self.pocket_client.connect()
            
            if not connection_result:
                logger.error("❌ Не вдалося підключитися до PocketOption")
                logger.info("⏸️ Пропускаю генерацію сигналів...")
                return []
            
            logger.info("✅ Підключення успішне!")
            logger.info(f"🎯 Генерую сигнали для {self.MAX_SIGNALS_PER_GENERATION} активів...")
            
            valid_signals = []
            failed_assets = []
            
            # Обмежуємо кількість активів для аналізу
            assets_to_process = Config.ASSETS[:self.MAX_SIGNALS_PER_GENERATION]
            logger.info(f"📊 Обробляємо активи: {assets_to_process}")
            
            for asset in assets_to_process:
                logger.info(f"\n{'='*30}")
                logger.info(f"💰 Обробка активу: {asset}")
                logger.info(f"{'='*30}")
                
                signal = await self.generate_signal(asset)
                if signal:
                    valid_signals.append(signal)
                    logger.info(f"✅ Сигнал для {asset} успішно створений")
                else:
                    logger.warning(f"⚠️ Не створено сигнал для {asset}")
                    failed_assets.append(asset)
                
                # Затримка між запитами для економії токенів
                await asyncio.sleep(self.REQUEST_DELAY)

            if valid_signals:
                logger.info(f"\n💾 Збереження {len(valid_signals)} сигналів...")
                save_result = self.data_handler.save_signals(valid_signals)
                
                if save_result:
                    logger.info(f"✅ Збережено {len(valid_signals)} сигналів")
                    
                    logger.info(f"\n🎯 ЗГЕНЕРОВАНО {len(valid_signals)} СИГНАЛІВ:")
                    for i, signal in enumerate(valid_signals, 1):
                        entry_delay = signal.get('entry_delay', 0)
                        logger.info(f"   {i}. {signal['asset']}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                        logger.info(f"      Вхід через {entry_delay} хв о {signal.get('entry_time', 'N/A')}, Тривалість: {signal.get('duration', 'N/A')} хв")
                        logger.info(f"      Волатильність: {signal.get('volatility', 0):.4f}%")
                else:
                    logger.error("❌ Помилка збереження сигналів")
            else:
                logger.warning("⚠️  Не створено жодного сигналу")
                
                if failed_assets:
                    logger.info(f"📉 Активи без сигналів: {', '.join(failed_assets)}")

            logger.info("🔌 Відключення від PocketOption...")
            await self.pocket_client.disconnect()
            logger.info("✅ Відключено від PocketOption")
            
            # Автоматичне очищення старих сигналів
            logger.info("🧹 Автоматичне очищення старих сигналів...")
            self.data_handler.auto_cleanup_old_signals()
            
            logger.info(f"\n⏱️  Час виконання: {Config.get_kyiv_time().strftime('%H:%M:%S')}")
            logger.info(f"📊 Підсумок: {len(valid_signals)} сигналів з {len(assets_to_process)} активів")
            logger.info("=" * 60)
            
            return valid_signals

        except Exception as e:
            logger.error(f"💥 Критична помилка: {e}")
            import traceback
            logger.error(f"📋 Трейс: {traceback.format_exc()}")
            return []

async def main():
    """Головна функція - запускається ТІЛЬКИ ОДИН РАЗ"""
    print("\n" + "="*60)
    print(f"🚀 ЗАПУСК ГЕНЕРАЦІЇ СИГНАЛІВ - {Config.get_kyiv_time().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📅 Поточний час UTC: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"⏰ Автоматичний запуск: кожні 10 хвилин (у :00, :10, :20, :30, :40, :50)")
    print(f"🌐 Мова: {Config.LANGUAGE}")
    print(f"💰 Обмеження: 3 сигнали для економії токенів Groq")
    print(f"🔄 Режим: {'DEMO' if Config.POCKET_DEMO else 'REAL'}")
    print("="*60)
    
    # Перевірка конфігурації
    if not Config.validate():
        print("❌ Помилка валідації конфігурації. Перевірте ваші змінні оточення.")
        return []
    
    logging.basicConfig(
        level=getattr(logging, Config.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    generator = SignalGenerator()
    signals = await generator.generate_all_signals()
    
    if signals:
        print(f"\n🎯 ЗГЕНЕРОВАНО {len(signals)} СИГНАЛІВ:")
        for signal in signals:
            entry_delay = signal.get('entry_delay', 0)
            print(f"   • {signal['asset']}: {signal['direction']} ({signal.get('confidence', 0)*100:.1f}%)")
            print(f"     Вхід через {entry_delay} хв о {signal.get('entry_time', 'N/A')}")
            print(f"     Генерація: {signal.get('generated_at', 'N/A')}")
    else:
        print("\n⚠️  СИГНАЛІВ НЕ ЗНАЙДЕНО")
        print("ℹ️  Можливі причини:")
        print("   - Проблема з підключенням до PocketOption")
        print("   - AI не повернув сигнали з достатньою впевненістю")
        print("   - Технічні проблеми з API")
    
    print(f"\n✅ Генерація сигналів завершена о {Config.get_kyiv_time().strftime('%H:%M:%S')}")
    print("="*60)
    
    # Очищаємо старі сигнали після генерації
    generator.data_handler.auto_cleanup_old_signals()
    
    # Важливо: Повідомляємо про наступний автоматичний запуск
    print(f"\n⏰ НАСТУПНИЙ АВТОМАТИЧНИЙ ЗАПУСК:")
    
    # ВИПРАВЛЕНИЙ КОД:
    now_utc = datetime.utcnow()
    
    # Розраховуємо наступний 10-хвилинний інтервал
    current_minute = now_utc.minute
    next_minute = ((current_minute // 10) + 1) * 10
    
    if next_minute >= 60:
        # Перехід на наступну годину
        next_time_utc = now_utc.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    else:
        # Це ж година
        next_time_utc = now_utc.replace(minute=next_minute, second=0, microsecond=0)
    
    # Розраховуємо різницю в часі
    time_diff = next_time_utc - now_utc
    minutes_left = int(time_diff.total_seconds() // 60)
    
    print(f"   • О {next_time_utc.strftime('%H:%M')} UTC")
    print(f"   • Через {minutes_left} хвилин")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
