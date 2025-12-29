import asyncio
import logging
from datetime import datetime, timedelta
from config import Config

# Налаштуємо логування для pocketoptionapi_async - відключимо DEBUG логи
logging.getLogger("pocketoptionapi_async").setLevel(logging.WARNING)
logging.getLogger("pocketoptionapi_async.websocket_client").setLevel(logging.WARNING)
logging.getLogger("pocketoptionapi_async.client").setLevel(logging.WARNING)

logger = logging.getLogger("signal_bot")

class PocketOptionClient:
    def __init__(self):
        self.client = None
        self.connected = False
        self._initialized = False
        self._connection_attempts = 0
        self._max_attempts = 3
        self._last_connection_time = None
        self._reconnection_delay = 5  # секунд
    
    async def initialize(self):
        if self._initialized:
            return self
        
        try:
            # Отримуємо SSID з конфігурації
            ssid = Config.get_validated_ssid()
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
            
            # Створюємо клієнта з вимкненим детальним логуванням
            self.client = AsyncPocketOptionClient(
                ssid=ssid,
                is_demo=Config.POCKET_DEMO,
                enable_logging=False  # ← ВИМКНУТИ детальне логування!
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
        """Метод підключення до PocketOption"""
        try:
            if not self._initialized:
                await self.initialize()
            
            if not self.client:
                logger.error("❌ Клієнт не ініціалізований")
                return False
            
            logger.info("🔗 Підключення до PocketOption...")
            
            # Спробуємо підключитися
            try:
                await self.client.connect()
                logger.info("✅ Виклик connect() успішний")
                await asyncio.sleep(2)  # Чекаємо на підключення
            except Exception as e:
                logger.error(f"❌ Помилка при виклику connect(): {e}")
                return False
            
            # Спробуємо отримати баланс - це найкраща перевірка підключення
            try:
                logger.info("🔄 Перевірка підключення через баланс...")
                balance = await self.client.get_balance()
                if balance and hasattr(balance, 'balance'):
                    self.connected = True
                    logger.info(f"✅ Успішно підключено до PocketOption!")
                    logger.info(f"💰 Баланс: {balance.balance} {balance.currency}")
                    return True
                else:
                    logger.error("❌ Баланс не отримано або неправильний формат")
                    return False
            except Exception as e:
                logger.error(f"❌ Не вдалося отримати баланс: {e}")
                return False
        
        except Exception as e:
            logger.error(f"❌ Помилка підключення: {e}")
            import traceback
            logger.error(f"Трейс: {traceback.format_exc()}")
            self.connected = False
            return False
    
    async def get_candles(self, asset, timeframe, count=50):
        """Отримання свічок"""
        try:
            # Конвертуємо формат активу (видаляємо слеш)
            asset_clean = asset.replace('/', '')
            
            if not self.connected:
                logger.warning(f"🔌 Не підключено для {asset}, спробую підключитися...")
                if not await self.connect():
                    logger.error(f"❌ Не вдалося підключитися для {asset}")
                    return None
            
            logger.info(f"📊 Запит свічок для {asset_clean}...")
            candles = await self.client.get_candles(
                asset=asset_clean,
                timeframe=timeframe,
                count=count
            )
            
            if not candles:
                logger.warning(f"⚠️ Не отримано свічок для {asset_clean}")
                return None
            
            # Перевіряємо, чи свічки містять реальні дані
            if len(candles) > 0:
                first_candle = candles[0]
                if hasattr(first_candle, 'close'):
                    if first_candle.close == 0 or first_candle.open == 0:
                        logger.warning(f"⚠️ Отримані нульові дані для {asset_clean}")
                        return None
            
            logger.info(f"✅ Отримано {len(candles)} коректних свічок для {asset_clean}")
            return candles
            
        except Exception as e:
            logger.error(f"❌ Помилка отримання свічок для {asset}: {e}")
            return None
    
    async def disconnect(self):
        if self.client:
            try:
                await self.client.disconnect()
                self.connected = False
                logger.info("✅ Відключено від PocketOption")
            except Exception as e:
                logger.warning(f"⚠️ Помилка при відключенні: {e}")
        else:
            logger.info("ℹ️ Не було активного підключення")
