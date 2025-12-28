import asyncio
import logging
from config import Config

logger = logging.getLogger("signal_bot")

class PocketOptionClient:
    def __init__(self):
        self.client = None
        self.connected = False
        self._initialized = False
    
    async def initialize(self):
        if self._initialized:
            return self
        
        try:
            # Отримуємо SSID з конфігурації
            ssid = Config.get_validated_ssid()  # Використовуємо метод з Config
            if not ssid:
                logger.error("❌ Не вдалося отримати валідний SSID!")
                return self
            
            logger.info(f"🔗 Ініціалізація PocketOption клієнта (Demo: {Config.POCKET_DEMO})...")
            
            # Імпортуємо асинхронного клієнта
            try:
                from pocketoptionapi_async import AsyncPocketOptionClient
            except ImportError as e:
                logger.error(f"❌ Не вдалося імпортувати pocketoptionapi_async: {e}")
                logger.info("ℹ️ Встановіть бібліотеку: pip install pocketoptionapi-async==2.0.1")
                return self
            
            # Створюємо клієнта з обома параметрами
            self.client = AsyncPocketOptionClient(
                ssid=ssid,
                is_demo=Config.POCKET_DEMO,  # ← ДОДАЙ ЦЕ!
                enable_logging=True  # ← Увімкнути для діагностики
            )
            
            self._initialized = True
            logger.info("✅ Клієнт ініціалізовано")
            return self
        
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації PocketOption: {e}")
            import traceback
            logger.error(f"Деталі: {traceback.format_exc()}")
            return self
    
    async def connect(self):
        """Виправлений метод підключення"""
        try:
            if not self._initialized:
                await self.initialize()
            
            if not self.client:
                logger.error("❌ Клієнт не ініціалізований")
                return False
            
            logger.info("🔗 Підключення до PocketOption...")
            connection_result = await self.client.connect()
            
            # Чекаємо на підключення
            await asyncio.sleep(2)
            
            # Перевіряємо статус через кілька способів
            if hasattr(self.client, 'connected') and self.client.connected:
                self.connected = True
                logger.info("✅ Успішно підключено до PocketOption!")
                
                # Тестуємо з'єднання - отримуємо баланс
                try:
                    balance = await self.client.get_balance()
                    logger.info(f"💰 Баланс: {balance.balance} {balance.currency}")
                    return True
                except Exception as e:
                    logger.warning(f"⚠️ Баланс не отримано, але продовжуємо: {e}")
                    return True
            
            logger.error("❌ Не вдалося підтвердити підключення до PocketOption!")
            self.connected = False
            return False  # ← Повертаємо False, а не True!
        
        except Exception as e:
            logger.error(f"❌ Помилка підключення: {e}")
            self.connected = False
            return False
    
    async def get_candles(self, asset, timeframe, count=30):
        """Додамо перевірку даних свічок"""
        try:
            if not self.connected:
                logger.warning("Не підключено, спробую підключитися...")
                if not await self.connect():
                    logger.error("Не вдалося підключитися")
                    return None
            
            logger.info(f"📊 Запит свічок для {asset}...")
            candles = await self.client.get_candles(
                asset=asset,
                timeframe=timeframe,
                count=count
            )
            
            if not candles:
                logger.warning(f"⚠️ Не отримано свічок для {asset}")
                return None
            
            # Перевіряємо, чи свічки містять реальні дані
            if len(candles) > 0:
                first_candle = candles[0]
                if hasattr(first_candle, 'close'):
                    if first_candle.close == 0 or first_candle.open == 0:
                        logger.warning(f"⚠️ Отримані нульові дані для {asset}")
                        return None
            
            logger.info(f"✅ Отримано {len(candles)} коректних свічок для {asset}")
            return candles
            
        except Exception as e:
            logger.error(f"❌ Помилка отримання свічок: {e}")
            return None
    
    async def disconnect(self):
        # Залишити без змін
        pass
