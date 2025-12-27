import asyncio
import logging
from pocketoptionapi_async import AsyncPocketOptionClient
from config import Config

logger = logging.getLogger("signal_bot")

class PocketOptionClient:
    def __init__(self):
        self.client = None
        self.connected = False
        self._initialized = False  # Додаємо прапорець ініціалізації
    
    async def initialize(self):
        """Ініціалізація клієнта (викликається один раз)"""
        if self._initialized:
            return self
            
        try:
            if not Config.POCKET_SSID:
                logger.error("❌ SSID не знайдено!")
                return self
            
            logger.info(f"🔗 Ініціалізація PocketOption клієнта...")
            
            # Створюємо клієнт
            self.client = AsyncPocketOptionClient(
                ssid=Config.POCKET_SSID,
                is_demo=Config.POCKET_DEMO,
                enable_logging=True
            )
            
            self._initialized = True
            logger.info("✅ Клієнт ініціалізовано")
            return self
            
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації: {e}")
            return self
    
    async def connect(self):
        """Підключення до Pocket Option"""
        try:
            # Ініціалізуємо, якщо ще не було
            if not self._initialized:
                await self.initialize()
            
            if not self.client:
                logger.error("❌ Клієнт не ініціалізований")
                return False
            
            logger.info(f"🔗 Підключення...")
            
            # Підключаємося
            connection_result = await self.client.connect()
            
            if connection_result:
                logger.info("✅ Успішно підключено до PocketOption!")
                self.connected = True
                
                # Тестуємо з'єднання
                try:
                    balance = await self.client.get_balance()
                    logger.info(f"💰 Баланс: {balance.balance} {balance.currency}")
                except Exception as e:
                    logger.warning(f"Баланс не отримано: {e}")
                
                return True
            else:
                logger.error("❌ Не вдалося підключитися до PocketOption")
                self.connected = False
                return False
                
        except Exception as e:
            logger.error(f"❌ Помилка підключення: {e}")
            self.connected = False
            return False
    
    async def get_candles(self, asset, timeframe, count=50):
        """Отримання свічок"""
        try:
            # Перевіряємо ініціалізацію
            if not self._initialized:
                await self.initialize()
            
            # Якщо не підключені, підключаємося
            if not self.connected:
                logger.warning(f"Спробую підключитися для {asset}...")
                if not await self.connect():
                    logger.error(f"Не вдалося підключитися для {asset}")
                    return None
            
            logger.info(f"📊 Запит свічок: {asset}")
            
            # Використовуємо правильний метод клієнта
            candles = await self.client.get_candles(
                asset=asset,
                timeframe=timeframe,
                count=count
            )
            
            if candles and len(candles) > 0:
                logger.info(f"✅ Отримано {len(candles)} свічок для {asset}")
                return candles
            else:
                logger.warning(f"Отримано 0 свічок для {asset}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Помилка отримання свічок для {asset}: {e}")
            return None
    
    async def disconnect(self):
        """Відключення"""
        try:
            if self.client and self.connected:
                await self.client.disconnect()
                self.connected = False
                logger.info("✅ Відключено від PocketOption")
                return True
            return False
        except Exception as e:
            logger.warning(f"Помилка відключення: {e}")
            return False
