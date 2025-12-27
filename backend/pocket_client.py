import asyncio
import logging
from datetime import datetime
from pocketoptionapi_async import AsyncPocketOptionClient
from config import Config

# Ініціалізація логера
logger = logging.getLogger("signal_bot")

class PocketOptionClient:
    def __init__(self):
        self.client = None
        self.connected = False
        
    async def connect(self):
        """Підключення до Pocket Option"""
        try:
            # Отримуємо валідований SSID
            ssid = Config.get_validated_ssid()
            
            logger.info(f"Підключення з форматом SSID: {ssid[:50]}...")
            
            self.client = AsyncPocketOptionClient(
                ssid=ssid,  # Використовуємо вже відформатований SSID
                is_demo=Config.POCKET_DEMO,
                enable_logging=True,
                timeout=30
            )
            
            # Підключаємося
            connection_result = await self.client.connect()
            
            if connection_result:
                logger.info("✅ Успішно підключено до PocketOption!")
                self.connected = True
                
                # Перевіряємо з'єднання, отримуючи баланс
                try:
                    balance = await self.client.get_balance()
                    logger.info(f"💰 Баланс: {balance.balance} {balance.currency}")
                except Exception as e:
                    logger.warning(f"Отримано баланс не вдалося: {e}")
                
                return self
            else:
                logger.error("❌ Не вдалося підключитися до PocketOption")
                self.connected = False
                return None
                
        except Exception as e:
            logger.error(f"❌ Критична помилка підключення: {e}")
            self.connected = False
            return None
    
    async def get_candles(self, asset, timeframe, count=50):
        """Отримання останніх свічок"""
        try:
            # Перевіряємо, чи підключені
            if not self.connected or not self.client:
                logger.warning(f"Не підключено до PocketOption. Спробую підключитися...")
                if not await self.connect():
                    logger.error(f"Не вдалося підключитися для отримання свічок {asset}")
                    return None
            
            logger.info(f"📊 Запит свічок: {asset}, timeframe: {timeframe}, count: {count}")
            
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
    
    async def get_balance(self):
        """Отримання балансу"""
        try:
            if not self.connected or not self.client:
                if not await self.connect():
                    return None
            
            balance = await self.client.get_balance()
            logger.info(f"Баланс: {balance.balance} {balance.currency}")
            return balance
            
        except Exception as e:
            logger.error(f"Помилка отримання балансу: {e}")
            return None
    
    async def disconnect(self):
        """Відключення"""
        try:
            if self.client:
                await self.client.disconnect()
                self.connected = False
                logger.info("Відключено від PocketOption")
        except Exception as e:
            logger.warning(f"Помилка при відключенні: {e}")
