import asyncio
import json
from datetime import datetime
from config import Config
from pocket_client import PocketOptionClient
from groq_analyzer import GroqAnalyzer
from data_handler import DataHandler
from utils.validator import Validator
from utils.logger import logger

class SignalGenerator:
    def __init__(self):
        self.pocket_client = PocketOptionClient()
        self.analyzer = GroqAnalyzer()
        self.data_handler = DataHandler()
        self.signals = []
        
    async def generate_signal(self, asset):
        """Генерація одного сигналу"""
        try:
            logger.info(f"Генерація сигналу для {asset}")
            
            # Отримуємо свічки
            candles = await self.pocket_client.get_candles(
                asset=asset,
                timeframe=Config.TIMEFRAMES,
                count=50
            )
            
            if not candles:
                logger.warning(f"Не вдалося отримати свічки для {asset}")
                return None
            
            # Аналізуємо через AI
            signal = self.analyzer.analyze_market(asset, candles)
            
            if signal:
                # Валідуємо сигнал
                is_valid, message = Validator.validate_signal(signal)
                
                if is_valid and Validator.validate_confidence(signal['confidence'], Config.MIN_CONFIDENCE):
                    signal['generated_at'] = datetime.now().isoformat()
                    signal['asset'] = asset  # Гарантуємо правильну назву активу
                    logger.info(f"✅ Створено сигнал для {asset}: {signal['direction']} ({signal['confidence']*100:.1f}%)")
                    return signal
                else:
                    logger.warning(f"❌ Сигнал не пройшов валідацію: {message}")
                    
        except Exception as e:
            logger.error(f"Помилка генерації сигналу для {asset}: {e}")
            
        return None
    
    async def generate_all_signals(self):
        """Генерація сигналів для всіх активів"""
        logger.info("=" * 50)
        logger.info(f"Початок генерації сигналів - {datetime.now()}")
        
        try:
            await self.pocket_client.connect()
            
            valid_signals = []
            for asset in Config.ASSETS:
                signal = await self.generate_signal(asset)
                if signal:
                    valid_signals.append(signal)
            
            # Зберігаємо сигнали
            if valid_signals:
                self.data_handler.save_signals(valid_signals)
                logger.info(f"📊 Збережено {len(valid_signals)} сигналів")
            else:
                logger.warning("⚠️  Не створено жодного сигналу")
            
            await self.pocket_client.disconnect()
            
            # Оновлюємо статистику
            stats = self.data_handler.get_statistics()
            logger.info(f"📈 Статистика: {stats.get('total_signals', 0)} сигналів, "
                       f"Успішність: {stats.get('success_rate', 0)*100:.1f}%")
            
            return valid_signals
            
        except Exception as e:
            logger.error(f"Критична помилка: {e}")
            return []

async def main():
    generator = SignalGenerator()
    await generator.generate_all_signals()

if __name__ == "__main__":
    asyncio.run(main())
