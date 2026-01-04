import asyncio
import logging
import os
from datetime import datetime, timedelta
import pytz
from config import Config
from pocket_client import PocketOptionClient
from groq_analyzer import GroqAnalyzer
from data_handler import DataHandler
from check_limits import UsageLimits

logger = logging.getLogger("signal_bot")

class SignalGenerator:
    def __init__(self):
        self.pocket_client = PocketOptionClient()
        self.analyzer = GroqAnalyzer()
        self.data_handler = DataHandler()
        self.usage_limits = UsageLimits()
        self.signals = []
        self.max_signals_to_show = Config.MAX_SIGNALS_TO_SHOW
        self.entry_delay_minutes = Config.ENTRY_DELAY_MINUTES

    async def generate_signal(self, asset):
        """Генерація одного сигналу з затримкою входу"""
        try:
            # Додаємо затримку між запитами до API для дотримання лімітів
            await asyncio.sleep(Config.MIN_TIME_BETWEEN_REQUESTS)
            
            logger.info(f"📈 Аналіз активу: {asset}")
            
            if not hasattr(self.pocket_client, 'client') or not self.pocket_client.client:
                logger.error("❌ PocketOptionClient не ініціалізований")
                return None
            
            logger.info(f"📊 Запит свічок для {asset}...")
            candles = await self.pocket_client.get_candles(
                asset=asset,
                timeframe=Config.TIMEFRAMES,
                count=30  # Менше даних для економії токенів
            )
            
            if not candles or len(candles) == 0:
                logger.error(f"❌ Не вдалося отримати свічки для {asset}")
                return None

            logger.info(f"✅ Отримано {len(candles)} свічок для {asset}")
            
            # Створюємо час входу через задану кількість хвилин після генерації
            now_kyiv = Config.get_kyiv_time()
            
            # Додаємо випадкову затримку від 1 до 3 хвилин
            import random
            actual_delay = self.entry_delay_minutes + random.randint(-1, 1)
            if actual_delay < 1:
                actual_delay = 1
            elif actual_delay > 3:
                actual_delay = 3
                
            entry_time_dt = now_kyiv + timedelta(minutes=actual_delay)
            entry_time = entry_time_dt.strftime('%H:%M')
            
            logger.info(f"🧠 Аналіз через GPT OSS 120B для {asset}...")
            signal = self.analyzer.analyze_market(
                asset=asset, 
                candles_data=candles, 
                language=Config.LANGUAGE,
                entry_time=entry_time  # Передаємо заданий час входу
            )

            if signal:
                confidence = signal.get('confidence', 0)
                logger.info(f"📝 AI повернув сигнал для {asset}: confidence={confidence*100:.1f}%")
                
                if confidence >= Config.MIN_CONFIDENCE:
                    # Записуємо використання токенів (приблизна оцінка)
                    estimated_tokens = 2500  # Середня оцінка на запит
                    self.usage_limits.record_usage(
                        tokens_used=estimated_tokens, 
                        requests_used=1
                    )
                    
                    duration = signal.get('duration', 2)
                    if duration > Config.MAX_DURATION:
                        logger.warning(f"⚠️ Сигнал для {asset} має завелику тривалість: {duration} > {Config.MAX_DURATION}")
                        signal['duration'] = Config.MAX_DURATION
                    
                    signal['generated_at'] = now_kyiv.isoformat()
                    signal['asset'] = asset
                    signal['id'] = f"{asset}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                    signal['entry_delay_minutes'] = actual_delay
                    
                    logger.info(f"✅ Створено сигнал для {asset}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                    logger.info(f"   📅 Вхід: {entry_time} (через {actual_delay} хв), Тривалість: {signal['duration']} хв")
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
        """Генерація сигналів для всіх активів з обмеженнями"""
        logger.info("=" * 60)
        logger.info(f"🚀 ПОЧАТОК ГЕНЕРАЦІЇ СИГНАЛІВ")
        logger.info(f"🌐 Мова: {Config.LANGUAGE}")
        logger.info(f"🕐 Час: {Config.get_kyiv_time().strftime('%Y-%m-%d %H:%M:%S')} (Київ)")
        logger.info(f"📊 Ліміти: {Config.MAX_SIGNALS_TO_SHOW} сигналів, затримка {Config.ENTRY_DELAY_MINUTES} хв")
        logger.info("=" * 60)

        try:
            # Перевіряємо ліміти використання
            if not self.usage_limits.can_generate():
                logger.warning("⏸️ Досягнуто денних лімітів. Генерацію пропущено.")
                return []
            
            # Підключення до PocketOption
            logger.info("🔗 Підключення до PocketOption...")
            connection_result = await self.pocket_client.connect()
            
            if not connection_result:
                logger.error("❌ Не вдалося підключитися до PocketOption")
                logger.info("⏸️ Пропускаю генерацію сигналів...")
                return []
            
            logger.info("✅ Підключення успішне!")
            
            # Обмежуємо кількість активів для економії токенів
            assets_to_analyze = Config.get_assets_for_generation()
            logger.info(f"🎯 Аналіз активів: {', '.join(assets_to_analyze)}")
            
            valid_signals = []
            failed_assets = []
            
            for asset in assets_to_analyze:
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

            # Обмежуємо кількість сигналів для відображення
            if len(valid_signals) > self.max_signals_to_show:
                logger.info(f"⚠️ Обмежую кількість сигналів з {len(valid_signals)} до {self.max_signals_to_show}")
                valid_signals = valid_signals[:self.max_signals_to_show]

            if valid_signals:
                logger.info(f"\n💾 Збереження {len(valid_signals)} сигналів...")
                save_result = self.data_handler.save_signals(valid_signals)
                
                if save_result:
                    logger.info(f"✅ Збережено {len(valid_signals)} сигналів")
                    
                    logger.info(f"\n🎯 ЗГЕНЕРОВАНО {len(valid_signals)} СИГНАЛІВ:")
                    for i, signal in enumerate(valid_signals, 1):
                        logger.info(f"   {i}. {signal['asset']}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                        logger.info(f"      Вхід: {signal.get('entry_time', 'N/A')} (через {signal.get('entry_delay_minutes', '?')} хв)")
                        logger.info(f"      Тривалість: {signal.get('duration', 'N/A')} хв")
                else:
                    logger.error("❌ Помилка збереження сигналів")
            else:
                logger.warning("⚠️  Не створено жодного сигналу")
                
                if failed_assets:
                    logger.info(f"📉 Активи без сигналів: {', '.join(failed_assets)}")

            logger.info("🔌 Відключення від PocketOption...")
            await self.pocket_client.disconnect()
            logger.info("✅ Відключено від PocketOption")
            
            logger.info(f"\n⏱️  Час виконання: {Config.get_kyiv_time().strftime('%H:%M:%S')}")
            logger.info(f"📊 Підсумок: {len(valid_signals)} сигналів з {len(assets_to_analyze)} активів")
            
            # Інформація про використання
            usage = self.usage_limits.get_current_usage()
            logger.info(f"📈 Використано: {usage['tokens_used']}/{Config.MAX_TOKENS_PER_DAY} токенів, "
                       f"{usage['requests_used']}/{Config.MAX_REQUESTS_PER_DAY} запитів")
            
            logger.info("=" * 60)
            
            return valid_signals

        except Exception as e:
            logger.error(f"💥 Критична помилка: {e}")
            import traceback
            logger.error(f"📋 Трейс: {traceback.format_exc()}")
            return []

async def main():
    """Головна функція - запускається автоматично"""
    print("\n" + "="*60)
    print(f"🚀 ЗАПУСК ГЕНЕРАЦІЇ СИГНАЛІВ - {Config.get_kyiv_time().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Мова: {Config.LANGUAGE}")
    print("="*60)
    
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
