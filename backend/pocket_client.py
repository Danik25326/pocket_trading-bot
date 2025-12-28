import asyncio
import logging
from pocketoptionapi_async import AsyncPocketOptionClient
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
            
            # Форматуємо SSID
            if not ssid.startswith('42["auth"'):
                logger.warning("Форматуємо SSID...")
                # Для демо режиму
                is_demo = 1 if Config.POCKET_DEMO else 0
                ssid = f'42["auth",{{"session":"{ssid}","isDemo":{is_demo},"uid":102582216,"platform":1}}]'
            
            logger.debug(f"SSID (перші 100 символів): {ssid[:100]}...")
            
            # Створюємо клієнт з правильними параметрами
            self.client = AsyncPocketOptionClient(
                ssid=ssid,
                uid=102582216,
                enable_logging=False  # Вимкнути логування для зменшення шуму
            )
            
            self._initialized = True
            logger.info("✅ Клієнт ініціалізовано")
            return self
        
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації: {e}")
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
            
            # Перевіряємо статус підключення
            if hasattr(self.client, 'connected') and self.client.connected:
                self.connected = True
                logger.info("✅ Успішно підключено до PocketOption!")
                return True
            else:
                # Спробуємо інший спосіб перевірки
                try:
                    # Спробуємо отримати баланс
                    balance = await self.client.get_balance()
                    if balance:
                        self.connected = True
                        logger.info(f"✅ Підключено! Баланс: {balance.balance} {balance.currency}")
                        return True
                except Exception as e:
                    logger.warning(f"Не вдалося отримати баланс: {e}")
                
                logger.error("❌ Не вдалося підключитися")
                self.connected = False
                return False
        
        except Exception as e:
            logger.error(f"❌ Помилка підключення: {e}")
            self.connected = False
            return False
    
    async def get_candles(self, asset, timeframe, count=50):
        """Отримання свічок для активу"""
        try:
            if not self.connected:
                logger.warning("Не підключено, спробую підключитися...")
                if not await self.connect():
                    return None
            
            logger.info(f"📊 Запит свічок для {asset} (таймфрейм: {timeframe}с)")
            
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
                # Спробуємо альтернативний формат назви активу
                alternative_asset = asset.replace('_otc', '')
                logger.info(f"🔄 Спробую альтернативну назву: {alternative_asset}")
                
                try:
                    candles = await self.client.get_candles(
                        asset=alternative_asset,
                        timeframe=timeframe,
                        count=count
                    )
                    if candles:
                        logger.info(f"✅ Отримано {len(candles)} свічок для {alternative_asset}")
                        return candles
                except Exception:
                    pass
                
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
