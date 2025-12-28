import asyncio
import logging
import sys
from pathlib import Path
from datetime import datetime
import pytz

# Додаємо шляхи для імпортів
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

# Імпорти після додавання шляхів
from config import Config
from pocket_client import PocketOptionClient
from groq_analyzer import GroqAnalyzer
from data_handler import DataHandler

# Налаштування логування
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("signal_bot")

class SignalGenerator:
    def __init__(self):
        self.pocket_client = PocketOptionClient()
        self.analyzer = GroqAnalyzer()
        self.data_handler = DataHandler()
        
        # Встановлюємо часовий пояс для всіх операцій
        self.kyiv_tz = pytz.timezone('Europe/Kiev')
    
    def get_current_time_str(self):
        """Повертає поточний час у Києві як рядок"""
        now = datetime.now(self.kyiv_tz)
        return now.strftime('%Y-%m-%d %H:%M:%S')
    
    async def generate_signal_for_asset(self, asset):
        """Генерація сигналу для одного активу"""
        try:
            logger.info(f"🔍 Аналіз активу: {asset}")
            
            # Перевірка підключення
            if not self.pocket_client.connected:
                logger.info("Підключаюся до PocketOption...")
                if not await self.pocket_client.connect():
                    logger.error(f"Не вдалося підключитися для {asset}")
                    return None
            
            # Отримання свічок
            logger.info(f"📥 Отримую свічки для {asset}...")
            candles = await self.pocket_client.get_candles(
                asset=asset,
                timeframe=Config.TIMEFRAMES,
                count=50
            )
            
            if not candles:
                logger.warning(f"⚠️ Не вдалося отримати свічки для {asset}")
                return None
            
            logger.info(f"📊 Отримано {len(candles)} свічок для {asset}")
            
            # Перевіряємо, чи є дані для аналізу
            if len(candles) < 10:
                logger.warning(f"Недостатньо свічок для аналізу {asset}: {len(candles)}")
                return None
            
            # Аналіз через AI
            signal = self.analyzer.analyze_market(asset, candles)
            
            if signal:
                # Додаємо час генерації (Київський час)
                signal['generated_at'] = datetime.now(self.kyiv_tz).isoformat()
                signal['asset'] = asset
                signal['timezone'] = 'Europe/Kiev (UTC+2)'
                
                # Логуємо сигнал
                logger.info(f"✅ Сигнал для {asset}: {signal['direction']} (впевненість: {signal['confidence']*100:.1f}%)")
                logger.info(f"   ⏰ Час входу: {signal.get('entry_time', 'N/A')} (Київ)")
                
                return signal
            else:
                logger.warning(f"AI не повернув сигнал для {asset}")
                return None
            
        except Exception as e:
            logger.error(f"❌ Помилка генерації сигналу для {asset}: {str(e)}")
            return None
    
    async def generate_all_signals(self):
        """Генерація сигналів для всіх активів"""
        logger.info("=" * 60)
        logger.info(f"🚀 ПОЧАТОК ГЕНЕРАЦІЇ СИГНАЛІВ")
        logger.info(f"⏰ Час запуску: {self.get_current_time_str()} (Київ)")
        logger.info(f"⚙️ Конфігурація:")
        logger.info(f"  • Активи: {', '.join(Config.ASSETS)}")
        logger.info(f"  • Модель AI: {Config.GROQ_MODEL}")
        logger.info(f"  • Мін. впевненість: {Config.MIN_CONFIDENCE*100}%")
        logger.info(f"  • Таймфрейм: {Config.TIMEFRAMES} секунд")
        logger.info("=" * 60)
        
        # Перевіряємо конфігурацію
        errors = Config.validate_config()
        if errors:
            for error in errors:
                logger.error(error)
            return []
        
        all_signals = []
        
        try:
            # Підключення
            logger.info("🔗 Підключення до PocketOption...")
            if not await self.pocket_client.connect():
                logger.error("❌ Не вдалося підключитися до PocketOption")
                return []
            
            logger.info("✅ Успішно підключено до PocketOption")
            
            # Генерація сигналів для кожного активу
            for asset in Config.ASSETS:
                logger.info(f"📈 Обробка активу: {asset}")
                signal = await self.generate_signal_for_asset(asset)
                if signal:
                    all_signals.append(signal)
                    logger.info(f"✅ Додано сигнал для {asset}")
                else:
                    logger.warning(f"⚠️ Не створено сигнал для {asset}")
                
                # Невелика пауза між активами
                await asyncio.sleep(1)
            
            # Збереження сигналів
            if all_signals:
                success = self.data_handler.save_signals(all_signals)
                if success:
                    logger.info(f"💾 Успішно збережено {len(all_signals)} сигналів")
                    
                    # Вивід інформації про сигнали
                    logger.info("📋 Згенеровані сигнали:")
                    for signal in all_signals:
                        logger.info(
                            f"   • {signal['asset']}: {signal['direction']} "
                            f"({signal['confidence']*100:.1f}%) "
                            f"о {signal.get('entry_time', 'N/A')} (Київ)"
                        )
                else:
                    logger.error("❌ Не вдалося зберегти сигнали")
            else:
                logger.warning("⚠️ Не створено жодного сигналу")
            
            # Відключення
            await self.pocket_client.disconnect()
            logger.info("✅ Відключено від PocketOption")
            
            # Статистика
            stats = self.data_handler.get_statistics()
            logger.info(f"📈 Статистика: {stats.get('total_signals', 0)} сигналів в історії")
            
            return all_signals
            
        except Exception as e:
            logger.error(f"💥 КРИТИЧНА ПОМИЛКА: {str(e)}")
            import traceback
            logger.error(f"Трейс помилки: {traceback.format_exc()}")
            
            # Намагаємося відключитися навіть при помилці
            try:
                await self.pocket_client.disconnect()
            except:
                pass
            
            return []

async def main():
    """Головна функція"""
    generator = SignalGenerator()
    
    # Перевіряємо, чи Groq API доступний
    if not generator.analyzer.client:
        print("❌ Groq AI не ініціалізовано. Перевірте GROQ_API_KEY.")
        return []
    
    signals = await generator.generate_all_signals()
    
    current_time = datetime.now(pytz.timezone('Europe/Kiev')).strftime('%H:%M:%S')
    
    if signals:
        print(f"\n🎯 ЗГЕНЕРОВАНО {len(signals)} СИГНАЛІВ ({current_time} Київ):")
        for signal in signals:
            print(f"   • {signal['asset']}: {signal['direction']} ({signal['confidence']*100:.1f}%) - {signal.get('entry_time', 'N/A')}")
    else:
        print(f"\n⚠️  СИГНАЛІВ НЕ ЗНАЙДЕНО ({current_time} Київ)")
    
    return signals

if __name__ == "__main__":
    asyncio.run(main())
