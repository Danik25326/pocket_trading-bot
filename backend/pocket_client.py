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
        """ВИПРАВЛЕНИЙ метод підключення з перевірками"""
        try:
            # Перевірка часу з останньої спроби підключення
            current_time = Config.get_kyiv_time()
            if self._last_connection_time:
                time_diff = (current_time - self._last_connection_time).total_seconds()
                if time_diff < self._reconnection_delay:
                    logger.info(f"⏳ Чекаємо перед повторним підключенням: {self._reconnection_delay - time_diff:.0f} сек")
                    await asyncio.sleep(self._reconnection_delay - time_diff)
            
            self._last_connection_time = current_time
            
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
                self._connection_attempts = 0
            except Exception as e:
                self._connection_attempts += 1
                logger.error(f"❌ Помилка при виклику connect() (спроба {self._connection_attempts}/{self._max_attempts}): {e}")
                
                if self._connection_attempts >= self._max_attempts:
                    logger.error("🚫 Досягнуто максимальну кількість спроб підключення")
                    return False
                
                # Затримка перед наступною спробою
                delay = self._reconnection_delay * self._connection_attempts
                logger.info(f"⏳ Чекаємо {delay} сек перед наступною спробою...")
                await asyncio.sleep(delay)
                return await self.connect()
            
            # Чекаємо на підключення
            await asyncio.sleep(2)
            
            # Спробуємо отримати баланс - це найкраща перевірка підключення
            try:
                logger.info("🔄 Перевірка підключення через баланс...")
                balance = await self.client.get_balance()
                if balance and hasattr(balance, 'balance'):
                    self.connected = True
                    logger.info(f"✅ Успішно підключено до PocketOption!")
                    logger.info(f"💰 Баланс: {balance.balance} {balance.currency}")
                    self._connection_attempts = 0
                    return True
                else:
                    logger.error("❌ Баланс не отримано або неправильний формат")
                    self.connected = False
                    return False
            except Exception as e:
                logger.error(f"❌ Не вдалося отримати баланс: {e}")
                self.connected = False
                return False
        
        except Exception as e:
            logger.error(f"❌ Помилка підключення: {e}")
            import traceback
            logger.error(f"Трейс: {traceback.format_exc()}")
            self.connected = False
            return False
    
    async def get_candles(self, asset, timeframe, count=50):
        """Отримання свічок з перевіркою актуальності"""
        try:
            # Перевірка активу (форматування)
            if not self._validate_asset_format(asset):
                logger.warning(f"⚠️ Неправильний формат активу: {asset}")
                return None
            
            if not self.connected:
                logger.warning("🔌 Не підключено, спробую підключитися...")
                if not await self.connect():
                    logger.error("❌ Не вдалося підключитися")
                    return None
            
            logger.info(f"📊 Запит свічок для {asset} (таймфрейм: {timeframe} сек, кількість: {count})...")
            
            # Отримуємо свічки
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
                # Перевірка першої свічки
                first_candle = candles[0]
                if hasattr(first_candle, 'close'):
                    if first_candle.close == 0 or first_candle.open == 0:
                        logger.warning(f"⚠️ Отримані нульові дані для {asset}")
                        return None
                
                # Перевірка останньої свічки на актуальність
                last_candle = candles[-1]
                if hasattr(last_candle, 'timestamp'):
                    current_time = Config.get_kyiv_time()
                    candle_time = last_candle.timestamp
                    
                    # Перевіряємо різницю в часі (не більше 5 хвилин для актуальності)
                    if isinstance(candle_time, datetime):
                        time_diff = (current_time - candle_time).total_seconds()
                        if time_diff > 300:  # 5 хвилин
                            logger.warning(f"⚠️ Остання свічка застаріла: {time_diff:.0f} сек тому")
                            return None
            
            # Перевірка мінімальної кількості свічок
            if len(candles) < 10:
                logger.warning(f"⚠️ Замало свічок для аналізу: {len(candles)}")
                return None
            
            logger.info(f"✅ Отримано {len(candles)} коректних свічок для {asset}")
            
            # Додаткова інформація про свічки
            if len(candles) > 0 and hasattr(candles[0], 'timestamp'):
                first_time = candles[0].timestamp
                last_time = candles[-1].timestamp
                logger.debug(f"📅 Діапазон свічок: {first_time} - {last_time}")
            
            return candles
            
        except Exception as e:
            logger.error(f"❌ Помилка отримання свічок для {asset}: {e}")
            import traceback
            logger.error(f"Трейс: {traceback.format_exc()}")
            return None
    
    async def disconnect(self):
        """Відключення з кращим управлінням станом"""
        if self.client:
            try:
                logger.info("🔌 Відключення від PocketOption...")
                await self.client.disconnect()
                self.connected = False
                self._initialized = False
                logger.info("✅ Відключено від PocketOption")
            except Exception as e:
                logger.warning(f"⚠️ Помилка при відключенні: {e}")
        else:
            logger.info("ℹ️ Не було активного підключення")
    
    def _validate_asset_format(self, asset):
        """Перевірка формату активу"""
        # Перевірка на наявність заборонених символів
        if not asset or len(asset.strip()) == 0:
            return False
        
        # Перевірка базового формату
        if '/' not in asset and '_' not in asset:
            logger.warning(f"⚠️ Дивний формат активу: {asset}")
        
        return True
    
    async def check_connection_health(self):
        """Перевірка здоров'я підключення"""
        if not self.connected:
            return False
        
        try:
            # Спроба отримати баланс для перевірки підключення
            balance = await self.client.get_balance()
            if balance and hasattr(balance, 'balance'):
                return True
            else:
                self.connected = False
                return False
        except Exception as e:
            logger.warning(f"⚠️ Проблема з підключенням: {e}")
            self.connected = False
            return False
    
    async def safe_disconnect(self):
        """Безпечне відключення з обробкою помилок"""
        try:
            await self.disconnect()
        except Exception as e:
            logger.warning(f"⚠️ Помилка при безпечному відключенні: {e}")
            # Скидаємо стан навіть при помилці
            self.connected = False
            self._initialized = False

# Глобальний інстанс для повторного використання
_client_instance = None

async def get_pocket_client():
    """Функція для отримання глобального інстансу клієнта"""
    global _client_instance
    if _client_instance is None:
        _client_instance = PocketOptionClient()
        await _client_instance.initialize()
    return _client_instance
