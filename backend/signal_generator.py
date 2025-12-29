import asyncio
import logging
from datetime import datetime, timedelta
from config import Config
from pocket_client import PocketOptionClient
from groq_analyzer import GroqAnalyzer
from data_handler import DataHandler

# Налаштування логування
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
            
            # Детальна інформація про підключення
            if not hasattr(self.pocket_client, 'client'):
                logger.error("❌ PocketOptionClient не ініціалізований")
                return None
            elif not self.pocket_client.client:
                logger.error("❌ Клієнт PocketOption не створений")
                return None
            
            # Логування стану підключення
            logger.info(f"🔌 Стан підключення для {asset}: {'✅ ПІДКЛЮЧЕНО' if self.pocket_client.connected else '❌ НЕ ПІДКЛЮЧЕНО'}")
            
            # Отримуємо свічки
            logger.info(f"📊 Запит свічок для {asset}...")
            candles = await self.pocket_client.get_candles(
                asset=asset,
                timeframe=Config.TIMEFRAMES,
                count=50
            )
            
            if not candles:
                logger.error(f"❌ Не вдалося отримати свічки для {asset}")
                return None
            elif len(candles) == 0:
                logger.error(f"❌ Отримано 0 свічок для {asset}")
                return None

            logger.info(f"✅ Отримано {len(candles)} свічок для {asset}")
            
            # Перевірка актуальності останньої свічки (виправлена версія)
            if hasattr(candles[-1], 'timestamp'):
                last_candle_time = candles[-1].timestamp
                current_time = Config.get_kyiv_time()
                
                # Конвертуємо час свічки в offset-aware, якщо він offset-naive
                if last_candle_time.tzinfo is None:
                    # Припускаємо, що час свічок в UTC
                    import pytz
                    last_candle_time = last_candle_time.replace(tzinfo=pytz.UTC)
                    # Конвертуємо в Київський час
                    last_candle_time = last_candle_time.astimezone(Config.KYIV_TZ)
                
                time_diff = (current_time - last_candle_time).total_seconds()
                
                if time_diff > 300:  # 5 хвилин
                    logger.warning(f"⚠️ Остання свічка застаріла: {time_diff:.0f} сек тому")
                    logger.warning(f"   Час свічки: {last_candle_time.strftime('%H:%M:%S')}")
                    logger.warning(f"   Поточний час: {current_time.strftime('%H:%M:%S')}")
                else:
                    logger.info(f"🕐 Остання свічка актуальна: {time_diff:.0f} сек тому")
                    logger.info(f"   Час свічки: {last_candle_time.strftime('%H:%M:%S')}")
            
            # Аналізуємо через AI
            logger.info(f"🧠 Аналіз через AI для {asset}...")
            signal = self.analyzer.analyze_market(asset, candles)

            if signal:
                logger.info(f"📝 AI повернув сигнал для {asset}: confidence={signal.get('confidence', 0)*100:.1f}%")
                
                if signal.get('confidence', 0) >= Config.MIN_CONFIDENCE:
                    # Перевірка тривалості (не більше MAX_DURATION)
                    duration = signal.get('duration', 0)
                    if duration > Config.MAX_DURATION:
                        logger.warning(f"⚠️ Сигнал для {asset} має завелику тривалість: {duration} > {Config.MAX_DURATION}")
                        return None
                    
                    # Перевірка часу входу
                    entry_time = signal.get('entry_time', '')
                    now_kyiv = Config.get_kyiv_time()
                    entry_datetime_kyiv = None
                    
                    try:
                        if ':' in entry_time:
                            hour, minute = map(int, entry_time.split(':'))
                            entry_datetime_kyiv = now_kyiv.replace(hour=hour, minute=minute, second=0, microsecond=0)
                            
                            # Якщо час вже минув сьогодні, додаємо день
                            if entry_datetime_kyiv < now_kyiv:
                                entry_datetime_kyiv = entry_datetime_kyiv + timedelta(days=1)
                            
                            time_to_entry = (entry_datetime_kyiv - now_kyiv).total_seconds() / 60
                            if time_to_entry < 0:
                                logger.warning(f"⚠️ Час входу в минулому: {entry_time}")
                                return None
                            elif time_to_entry > 10:  # Не більше 10 хвилин вперед
                                logger.warning(f"⚠️ Час входу занадто далеко: {time_to_entry:.1f} хв")
                                return None
                            
                            logger.info(f"⏰ Час входу: {entry_time} (через {time_to_entry:.1f} хв)")
                            
                            # Конвертуємо час входу з київського в UTC
                            import pytz
                            entry_datetime_utc = entry_datetime_kyiv.astimezone(pytz.UTC)
                            signal['entry_time_utc'] = entry_datetime_utc.isoformat()
                            signal['entry_time_kyiv'] = entry_time
                            
                    except Exception as e:
                        logger.warning(f"⚠️ Помилка перевірки часу входу: {e}")
                        signal['entry_time_utc'] = None
                        signal['entry_time_kyiv'] = entry_time
                    
                    signal['generated_at'] = now_kyiv.isoformat()
                    signal['asset'] = asset
                    signal['id'] = f"{asset}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                    
                    logger.info(f"✅ Створено сигнал для {asset}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                    logger.info(f"   📅 Вхід: {entry_time}, Тривалість: {duration} хв")
                    logger.info(f"   ⌚ Київський час: {entry_time}, UTC: {signal.get('entry_time_utc', 'N/A')}")
                    
                    return signal
                else:
                    logger.warning(f"⚠️ Сигнал для {asset} має низьку впевненість: {signal.get('confidence', 0)*100:.1f}%")
            else:
                logger.warning(f"⚠️ AI не повернув сигнал для {asset}")
                    
        except Exception as e:
            logger.error(f"❌ Помилка генерації сигналу для {asset}: {e}")
            import traceback
            logger.error(f"📋 Трейс: {traceback.format_exc()}")

        return None

    async def generate_all_signals(self):
        """Генерація сигналів для всіх активів - ТІЛЬКИ ОДИН РАЗ"""
        logger.info("=" * 50)
        logger.info(f"🚀 Початок генерації сигналів - {Config.get_kyiv_time().strftime('%Y-%m-%d %H:%M:%S')} (Київ)")

        try:
            # Виводимо конфігурацію
            logger.info(f"⚙️ Конфігурація:")
            logger.info(f"  - Демо режим: {Config.POCKET_DEMO}")
            logger.info(f"  - Активи: {Config.ASSETS}")
            logger.info(f"  - Таймфрейм: {Config.TIMEFRAMES} сек ({Config.TIMEFRAMES/60} хв)")
            logger.info(f"  - Мін. впевненість: {Config.MIN_CONFIDENCE*100}%")
            logger.info(f"  - Макс. тривалість: {Config.MAX_DURATION} хв")
            logger.info(f"  - Часовий пояс: Київ (UTC+2)")
            
            # Перевірка останнього оновлення
            existing_data = self.data_handler.load_signals()
            last_update = existing_data.get('last_update')
            
            if last_update:
                last_time = datetime.fromisoformat(last_update)
                time_diff = (Config.get_kyiv_time() - last_time).total_seconds()
                if time_diff < Config.SIGNAL_INTERVAL:
                    logger.info(f"⏳ Ще не пройшло 5 хвилин з останньої генерації ({time_diff:.0f} сек)")
                    logger.info(f"   Останнє оновлення: {last_time.strftime('%H:%M:%S')}")
                    logger.info(f"   Наступне оновлення через: {Config.SIGNAL_INTERVAL - time_diff:.0f} сек")
                    return []  # Повертаємо порожній список
            
            # ДЕТАЛЬНЕ ПІДКЛЮЧЕННЯ
            logger.info("🔗 Підключення до PocketOption...")
            logger.info(f"   Режим: {'DEMO' if Config.POCKET_DEMO else 'REAL'}")
            logger.info(f"   SSID наявний: {'✅ ТАК' if Config.POCKET_SSID else '❌ НІ'}")
            
            if not Config.POCKET_SSID:
                logger.error("❌ SSID не знайдено! Перевірте .env або GitHub Secrets")
                return []
            
            # Підключення
            logger.info("🔄 Виклик методу connect()...")
            connection_result = await self.pocket_client.connect()
            
            if not connection_result:
                logger.error("❌ Не вдалося підключитися до PocketOption")
                logger.info("⏸️ Пропускаю генерацію сигналів...")
                return []  # Повертаємо порожній список
            
            # Продовжуємо тільки якщо підключення успішне
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
                    
                    # Виводимо детальну інформацію про сигнали
                    logger.info(f"\n🎯 ЗГЕНЕРОВАНО {len(valid_signals)} СИГНАЛІВ:")
                    for i, signal in enumerate(valid_signals, 1):
                        logger.info(f"   {i}. {signal['asset']}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                        logger.info(f"      Вхід: {signal.get('entry_time_kyiv', signal.get('entry_time', 'N/A'))}, Тривалість: {signal.get('duration', 'N/A')} хв")
                        logger.info(f"      ID: {signal.get('id', 'N/A')}")
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
            
            # Інформація про завершення
            logger.info(f"\n⏱️  Час виконання: {Config.get_kyiv_time().strftime('%H:%M:%S')}")
            logger.info(f"📊 Підсумок: {len(valid_signals)} сигналів з {len(Config.ASSETS)} активів")
            
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
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    generator = SignalGenerator()
    signals = await generator.generate_all_signals()
    
    if signals:
        print(f"\n🎯 ЗГЕНЕРОВАНО {len(signals)} СИГНАЛІВ:")
        for signal in signals:
            print(f"   • {signal['asset']}: {signal['direction']} ({signal.get('confidence', 0)*100:.1f}%) - Вхід: {signal.get('entry_time_kyiv', signal.get('entry_time', 'N/A'))}")
    else:
        print("\n⚠️  СИГНАЛІВ НЕ ЗНАЙДЕНО")
    
    print(f"\n✅ Генерація сигналів завершена о {Config.get_kyiv_time().strftime('%H:%M:%S')}")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
