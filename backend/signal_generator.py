import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta
import pytz
import random
from config import Config
from pocket_client import PocketOptionClient
from groq_analyzer import GroqAnalyzer
from data_handler import DataHandler

# НАЛАШТУВАННЯ ЛОГУВАННЯ НА ПОЧАТКУ
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger("signal_bot")

class SignalGenerator:
    def __init__(self):
        self.pocket_client = PocketOptionClient()
        self.analyzer = GroqAnalyzer()
        self.data_handler = DataHandler()
        self.signals = []
        
        self.MAX_SIGNALS_PER_GENERATION = 3
        self.REQUEST_DELAY = 2

    async def generate_signal(self, asset):
        """Генерація сигналу"""
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
            
            # Перевірка актуальності
            if hasattr(candles[-1], 'timestamp'):
                last_candle_time = candles[-1].timestamp
                current_time = Config.get_kyiv_time()
                
                if last_candle_time.tzinfo is None:
                    last_candle_time = pytz.UTC.localize(last_candle_time)
                
                last_candle_time_kyiv = last_candle_time.astimezone(Config.KYIV_TZ)
                time_diff = (current_time - last_candle_time_kyiv).total_seconds()
                
                if time_diff > 300:
                    logger.warning(f"⚠️ Остання свічка застаріла: {time_diff:.0f} сек тому")
            
            logger.info(f"🧠 Аналіз через AI для {asset}...")
            signal = self.analyzer.analyze_market(asset, candles, language=Config.LANGUAGE)

            if signal:
                confidence = signal.get('confidence', 0)
                logger.info(f"📝 AI повернув сигнал: confidence={confidence*100:.1f}%")
                
                if confidence >= Config.MIN_CONFIDENCE:
                    duration = signal.get('duration', 2)
                    if duration > Config.MAX_DURATION:
                        logger.warning(f"⚠️ Сигнал має завелику тривалість: {duration} > {Config.MAX_DURATION}")
                        signal['duration'] = Config.MAX_DURATION
                    
                    now_kyiv = Config.get_kyiv_time()
                    
                    # Фіксована затримка 2 хвилини
                    delay_minutes = 2
                    entry_time_dt = now_kyiv + timedelta(minutes=2)
                    signal['entry_time'] = entry_time_dt.strftime('%H:%M')
                    signal['entry_delay'] = 2
                    
                    signal['generated_at'] = now_kyiv.isoformat()
                    signal['generated_at_utc'] = datetime.utcnow().isoformat() + 'Z'
                    signal['asset'] = asset
                    signal['id'] = f"{asset}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                    
                    if 'volatility' not in signal:
                        signal['volatility'] = 0.0
                    
                    logger.info(f"✅ Створено сигнал: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                    logger.info(f"   📅 Вхід через {delay_minutes} хв о {signal['entry_time']}")
                    return signal
                else:
                    logger.warning(f"⚠️ Низька впевненість: {confidence*100:.1f}%")
            else:
                logger.warning(f"⚠️ AI не повернув сигнал для {asset}")
                    
        except Exception as e:
            logger.error(f"❌ Помилка генерації сигналу: {e}")
            import traceback
            logger.error(f"📋 Трейс: {traceback.format_exc()}")

        return None

    async def generate_all_signals(self):
        """Генерація всіх сигналів"""
        logger.info("=" * 60)
        logger.info("🚀 ПОЧАТОК ГЕНЕРАЦІЇ СИГНАЛІВ")
        logger.info(f"🌐 Мова: {Config.LANGUAGE}")
        logger.info(f"🕐 Час: {Config.get_kyiv_time().strftime('%Y-%m-%d %H:%M:%S')} (Київ)")
        logger.info("=" * 60)

        try:
            logger.info("⚙️ КОНФІГУРАЦІЯ:")
            logger.info(f"  - Активи: {Config.ASSETS}")
            logger.info(f"  - Таймфрейм: {Config.TIMEFRAMES} сек")
            logger.info(f"  - Мін. впевненість: {Config.MIN_CONFIDENCE*100}%")
            logger.info(f"  - Макс. тривалість: {Config.MAX_DURATION} хв")
            logger.info(f"  - Модель AI: {Config.GROQ_MODEL}")
            logger.info(f"  - Мова: {Config.LANGUAGE}")
            
            # ПЕРЕВІРКА ТОКЕНА ПЕРЕД ПІДКЛЮЧЕННЯМ
            logger.info("🔍 Перевірка токена...")
            ssid = Config.get_validated_ssid()
            if not ssid:
                logger.error("❌ Не вдалося отримати валідний SSID!")
                logger.error("❌ Перевірте .env або GitHub Secrets")
                return []
            
            logger.info(f"✅ Токен знайдено (довжина: {len(ssid)} символів)")
            logger.info(f"📝 Початок токена: {ssid[:100]}...")
            
            logger.info("🔗 Підключення до рахунку...")
            
            connection_result = await self.pocket_client.connect()
            
            if not connection_result:
                logger.error("❌ Не вдалося підключитися до рахунку!")
                logger.error("❌ Перевірте токен та інтернет з'єднання")
                return []
            
            logger.info("✅ Успішно підключено!")
            logger.info(f"🎯 Генерую сигнали для {self.MAX_SIGNALS_PER_GENERATION} активів...")
            
            valid_signals = []
            failed_assets = []
            
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
                        logger.info(f"      Вхід через {entry_delay} хв о {signal.get('entry_time', 'N/A')}")
                else:
                    logger.error("❌ Помилка збереження сигналів")
            else:
                logger.warning("⚠️ Не створено жодного сигналу")
                
                if failed_assets:
                    logger.info(f"📉 Активи без сигналів: {', '.join(failed_assets)}")

            logger.info("🔌 Відключення від рахунку...")
            await self.pocket_client.disconnect()
            logger.info("✅ Відключено від рахунку")
            
            logger.info("🧹 Очищення старих сигналів...")
            self.data_handler.auto_cleanup_old_signals()
            
            logger.info(f"\n⏱️ Час виконання: {Config.get_kyiv_time().strftime('%H:%M:%S')}")
            logger.info(f"📊 Підсумок: {len(valid_signals)} сигналів")
            logger.info("=" * 60)
            
            return valid_signals

        except Exception as e:
            logger.error(f"💥 Критична помилка: {e}")
            import traceback
            logger.error(f"📋 Трейс: {traceback.format_exc()}")
            return []

async def main():
    print("\n" + "="*60)
    print(f"🚀 ЗАПУСК ГЕНЕРАЦІЇ СИГНАЛІВ")
    print(f"📅 Поточний час: {Config.get_kyiv_time().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Мова: {Config.LANGUAGE}")
    print("="*60)
    
    # СПОЧАТКУ ПЕРЕВІРИТИ ЧИ Є ТОКЕН
    print("🔍 Перевірка змінних середовища...")
    print(f"📋 POCKET_SSID встановлено: {'✅' if Config.POCKET_SSID else '❌'}")
    print(f"📋 GROQ_API_KEY встановлено: {'✅' if Config.GROQ_API_KEY else '❌'}")
    
    if not Config.POCKET_SSID:
        print("❌ ПОМИЛКА: POCKET_SSID не знайдено!")
        print("❌ Перевірте .env файл або GitHub Secrets")
        print("❌ Поточний токен: None")
        return []
    
    print(f"📝 Довжина POCKET_SSID: {len(Config.POCKET_SSID)} символів")
    print(f"📝 Перші 100 символів: {Config.POCKET_SSID[:100]}")
    
    if not Config.validate():
        print("❌ Помилка валідації конфігурації")
        print("❌ Перевірте токен та налаштування")
        return []
    
    generator = SignalGenerator()
    signals = await generator.generate_all_signals()
    
    if signals:
        print(f"\n🎯 ЗГЕНЕРОВАНО {len(signals)} СИГНАЛІВ:")
        for signal in signals:
            entry_delay = signal.get('entry_delay', 0)
            print(f"   • {signal['asset']}: {signal['direction']} ({signal.get('confidence', 0)*100:.1f}%)")
            print(f"     Вхід через {entry_delay} хв о {signal.get('entry_time', 'N/A')}")
    else:
        print("\n⚠️ СИГНАЛІВ НЕ ЗНАЙДЕНО")
        print("ℹ️ Можливі причини:")
        print("   - Проблема з підключенням до рахунку")
        print("   - Токен прострочений або невірний")
        print("   - AI не повернув сигнали з достатньою впевненістю")
    
    print(f"\n✅ Генерація сигналів завершена")
    print("="*60)
    
    if hasattr(generator, 'data_handler'):
        generator.data_handler.auto_cleanup_old_signals()

if __name__ == "__main__":
    asyncio.run(main())
