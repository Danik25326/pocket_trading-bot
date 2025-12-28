
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
            ssid = Config.POCKET_SSID
            if not ssid:
                logger.error("❌ SSID не знайдено!")
                return self
            
            logger.info(f"🔗 Ініціалізація PocketOption клієнта (Demo: {Config.POCKET_DEMO})...")
            
            # Імпортуємо асинхронного клієнта
            try:
                from pocketoptionapi_async import AsyncPocketOptionClient
            except ImportError as e:
                logger.error(f"❌ Не вдалося імпортувати pocketoptionapi_async: {e}")
                logger.info("ℹ️ Встановіть бібліотеку: pip install pocketoptionapi-async==2.0.1")
                return self
            
            # Форматуємо SSID
            if not ssid.startswith('42["auth"'):
                logger.info("Форматуємо SSID...")
                # Для демо режиму
                is_demo = 1 if Config.POCKET_DEMO else 0
                ssid = f'42["auth",{{"session":"{ssid}","isDemo":{is_demo},"uid":102582216,"platform":1}}]'
            
            logger.debug(f"SSID (перші 100 символів): {ssid[:100]}...")
            
            # Створюємо клієнта
            self.client = AsyncPocketOptionClient(
                ssid=ssid,
                enable_logging=False
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
        try:
            if not self._initialized:
                await self.initialize()
            
            if not self.client:
                logger.error("❌ Клієнт не ініціалізований")
                return False
            
            logger.info("🔗 Підключення до PocketOption...")
            await self.client.connect()
            
            # Чекаємо на підключення
            await asyncio.sleep(2)
            
            # Перевіряємо статус
            if hasattr(self.client, 'connected') and self.client.connected:
                self.connected = True
                logger.info("✅ Успішно підключено до PocketOption!")
                return True
            else:
                logger.warning("⚠️ Не вдалося підтвердити підключення, але продовжуємо...")
                self.connected = True
                return True
        
        except Exception as e:
            logger.error(f"❌ Помилка підключення: {e}")
            self.connected = False
            return False
    
    async def get_candles(self, asset, timeframe, count=30):
        """Отримання свічок для активу"""
        try:
            if not self.connected:
                logger.warning("Не підключено, спробую підключитися...")
                if not await self.connect():
                    logger.error("Не вдалося підключитися")
                    return None
            
            logger.info(f"📊 Запит свічок для {asset} (таймфрейм: {timeframe}с, кількість: {count})")
            
            # Отримуємо свічки
            candles = await self.client.get_candles(
                asset=asset,
                timeframe=timeframe,
                count=count
            )
            
            if candles:
                logger.info(f"✅ Отримано {len(candles)} свічок для {asset}")
                return candles
            else:
                logger.warning(f"⚠️ Не отримано свічок для {asset}")
                return None
        
        except Exception as e:
            logger.error(f"❌ Помилка отримання свічок для {asset}: {e}")
            return None
    
    async def disconnect(self):
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
