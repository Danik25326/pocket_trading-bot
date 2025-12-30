import asyncio
import logging
from datetime import datetime, timedelta
import pytz
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

    async def generate_signal(self, asset):
        """Генерація одного сигналу"""
        try:
            logger.info(f"📈 Аналіз активу: {asset}")
            
            # Перевірка підключення
            if not hasattr(self.pocket_client, 'client') or not self.pocket_client.client:
                logger.error("❌ PocketOptionClient не ініціалізований")
                return None
            
            # Отримуємо свічки
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
            
            # ПЕРЕВІРКА: Якщо остання свічка старіша за 5 хвилин - ПРОПУСКАЄМО
            if hasattr(candles[-1], 'timestamp'):
                last_candle_time = candles[-1].timestamp
                current_time = Config.get_kyiv_time()
                
                # Якщо свічка має часовий пояс, видаляємо його для порівняння
                if last_candle_time.tzinfo is not None:
                    last_candle_time = last_candle_time.replace(tzinfo=None)
                
                # Перетворюємо current_time також без часового поясу для порівняння
                current_time_no_tz = current_time.replace(tzinfo=None)
                time_diff = (current_time_no_tz - last_candle_time).total_seconds()
                
                if time_diff > 300:  # 5 хвилин
                    logger.error(f"❌ Свічки для {asset} ЗАСТАРІЛІ: {time_diff:.0f} сек ({time_diff/60:.1f} хв)")
                    logger.error(f"   Час останньої свічки: {last_candle_time}")
                    logger.error(f"   Поточний час: {current_time_no_tz}")
                    logger.error(f"   Пропускаємо актив {asset}")
                    return None
            
            # Перевірка актуальності останньої свічки (додаткова перевірка)
            if hasattr(candles[-1], 'timestamp'):
                last_candle_time = candles[-1].timestamp
                current_time = Config.get_kyiv_time()
                
                if last_candle_time.tzinfo is None:
                    last_candle_time = pytz.UTC.localize(last_candle_time)
                
                last_candle_time_kyiv = last_candle_time.astimezone(Config.KYIV_TZ)
                time_diff = (current_time - last_candle_time_kyiv).total_seconds()
                
                # Якщо свічка старіша за 5 хвилин - пропускаємо актив
                if time_diff > 300:  # 5 хвилин
                    logger.error(f"❌ Свічки для {asset} застарілі: {time_diff:.0f} сек")
                    return None
                elif time_diff > 180:  # 3 хвилини
                    logger.warning(f"⚠️ Остання свічка трохи застаріла: {time_diff:.0f} сек тому")
                else:
                    logger.info(f"🕐 Остання свічка актуальна: {time_diff:.0f} сек тому")
            
            # Аналізуємо через AI
            logger.info(f"🧠 Аналіз через GPT OSS 120B для {asset}...")
            signal = self.analyzer.analyze_market(asset, candles)

            if signal:
                confidence = signal.get('confidence', 0)
                logger.info(f"📝 AI повернув сигнал для {asset}: confidence={confidence*100:.1f}%")
                
                if confidence >= Config.MIN_CONFIDENCE:
                    # Перевірка тривалості
                    duration = signal.get('duration', 2)
                    if duration > Config.MAX_DURATION:
                        logger.warning(f"⚠️ Сигнал для {asset} має завелику тривалість: {duration} > {Config.MAX_DURATION}")
                        signal['duration'] = Config.MAX_DURATION
                    
                    # Додаємо часові мітки
                    now_kyiv = Config.get_kyiv_time()
                    signal['generated_at'] = now_kyiv.isoformat()
                    signal['generated_at_utc'] = datetime.utcnow().isoformat() + 'Z'
                    signal['asset'] = asset
                    signal['id'] = f"{asset}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                    
                    # Перевіряємо час входу
                    entry_time = signal.get('entry_time', '')
                    if ':' in entry_time:
                        hour, minute = map(int, entry_time.split(':'))
                        entry_datetime = now_kyiv.replace(hour=hour, minute=minute, second=0, microsecond=0)
                        
                        if entry_datetime < now_kyiv:
                            entry_datetime += timedelta(days=1)
                        
                        time_to_entry = (entry_datetime - now_kyiv).total_seconds() / 60
                        logger.info(f"⏰ Час входу: {entry_time} (через {time_to_entry:.1f} хв)")
                    
                    logger.info(f"✅ Створено сигнал для {asset}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                    logger.info(f"   📅 Вхід: {entry_time}, Тривалість: {signal['duration']} хв")
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
        """Генерація сигналів для всіх активів - одноразово"""
        logger.info("=" * 60)
        logger.info(f"🚀 ПОЧАТОК ГЕНЕРАЦІЇ СИГНАЛІВ")
        logger.info(f"🕐 Час: {Config.get_kyiv_time().strftime('%Y-%m-%d %H:%M:%S')} (Київ)")
        logger.info("=" * 60)

        try:
            # Виводимо конфігурацію
            logger.info(f"⚙️ Конфігурація:")
            logger.info(f"  - Демо режим: {Config.POCKET_DEMO}")
            logger.info(f"  - Активи: {Config.ASSETS}")
            logger.info(f"  - Таймфрейм: {Config.TIMEFRAMES} сек ({Config.TIMEFRAMES/60} хв)")
            logger.info(f"  - Мін. впевненість: {Config.MIN_CONFIDENCE*100}%")
            logger.info(f"  - Макс. тривалість: {Config.MAX_DURATION} хв")
            logger.info(f"  - Модель AI: {Config.GROQ_MODEL}")
            logger.info(f"  - Часовий пояс: Київ (UTC+2)")
            
            # Перевірка останнього оновлення
            existing_data = self.data_handler.load_signals()
            last_update = existing_data.get('last_update')
            
            if last_update:
                try:
                    last_time = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
                    time_diff = (datetime.utcnow() - last_time).total_seconds()
                    
                    if time_diff < Config.SIGNAL_INTERVAL:
                        logger.info(f"⏳ Ще не пройшло 5 хвилин з останньої генерації ({time_diff:.0f} сек)")
                        logger.info(f"   Останнє оновлення: {last_time.strftime('%H:%M:%S')} UTC")
                        return []  # Повертаємо порожній список
                except Exception as e:
                    logger.warning(f"⚠️ Помилка перевірки часу: {e}")
            
            # Підключення до PocketOption
            logger.info("🔗 Підключення до PocketOption...")
            logger.info(f"   Режим: {'DEMO' if Config.POCKET_DEMO else 'REAL'}")
            
            connection_result = await self.pocket_client.connect()
            
            if not connection_result:
                logger.error("❌ Не вдалося підключитися до PocketOption")
                logger.info("⏸️ Пропускаю генерацію сигналів...")
                return []  # Повертаємо порожній список
            
            logger.info("✅ Підключення успішне!")
            logger.info("🎯 Генерую сигнали для активів...")
            
            valid_signals = []
            failed_assets = []
            
            for asset in Config.ASSETS:
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

            # Зберігаємо сигнали
            if valid_signals:
                logger.info(f"\n💾 Збереження {len(valid_signals)} сигналів...")
                save_result = self.data_handler.save_signals(valid_signals)
                
                if save_result:
                    logger.info(f"✅ Збережено {len(valid_signals)} сигналів")
                    
                    # Виводимо детальну інформацію
                    logger.info(f"\n🎯 ЗГЕНЕРОВАНО {len(valid_signals)} СИГНАЛІВ:")
                    for i, signal in enumerate(valid_signals, 1):
                        logger.info(f"   {i}. {signal['asset']}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                        logger.info(f"      Вхід: {signal.get('entry_time', 'N/A')}, Тривалість: {signal.get('duration', 'N/A')} хв")
                        logger.info(f"      Волатильність: {signal.get('volatility', 0):.4f}%")
                else:
                    logger.error("❌ Помилка збереження сигналів")
            else:
                logger.warning("⚠️  Не створено жодного сигналу")
                
                if failed_assets:
                    logger.info(f"📉 Активи без сигналів: {', '.join(failed_assets)}")

            # Відключаємося
            logger.info("🔌 Відключення від PocketOption...")
            await self.pocket_client.disconnect()
            logger.info("✅ Відключено від PocketOption")
            
            # Підсумок
            logger.info(f"\n⏱️  Час виконання: {Config.get_kyiv_time().strftime('%H:%M:%S')}")
            logger.info(f"📊 Підсумок: {len(valid_signals)} сигналів з {len(Config.ASSETS)} активів")
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
    print("="*60)
    
    # Ініціалізація логування
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
            print(f"   • {signal['asset']}: {signal['direction']} ({signal.get('confidence', 0)*100:.1f}%) - {signal.get('entry_time', 'N/A')}")
    else:
        print("\n⚠️  СИГНАЛІВ НЕ ЗНАЙДЕНО")
    
    print(f"\n✅ Генерація сигналів завершена о {Config.get_kyiv_time().strftime('%H:%M:%S')}")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
