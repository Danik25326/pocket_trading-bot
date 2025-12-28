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
            
            # Створюємо клієнта
            self.client = AsyncPocketOptionClient(
                ssid=ssid,
                is_demo=Config.POCKET_DEMO,
                enable_logging=True
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
        """ВИПРАВЛЕНИЙ метод підключення"""
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
            except Exception as e:
                logger.error(f"❌ Помилка при виклику connect(): {e}")
                return False
            
            # Чекаємо на підключення - БІЛЬШЕ ЧАСУ!
            await asyncio.sleep(5)  # Збільшив до 5 секунд
            
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
                
                # Альтернативна перевірка - спробуємо отримати ассети
                try:
                    logger.info("🔄 Альтернативна перевірка - запит ассетів...")
                    assets = await self.client.get_assets()
                    if assets:
                        self.connected = True
                        logger.info(f"✅ Підключення підтверджено через ассети (отримано: {len(assets)})")
                        return True
                except Exception as e2:
                    logger.error(f"❌ Альтернативна перевірка теж не вдалася: {e2}")
                
                return False
        
        except Exception as e:
            logger.error(f"❌ Помилка підключення: {e}")
            import traceback
            logger.error(f"Трейс: {traceback.format_exc()}")
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
        if self.client and hasattr(self.client, 'connected'):
            try:
                await self.client.disconnect()
                self.connected = False
                logger.info("✅ Відключено від PocketOption")
            except:
                pass
        else:
            logger.info("ℹ️ Не було активного підключення")
