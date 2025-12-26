import asyncio
from datetime import datetime
from pocketoptionapi_async import AsyncPocketOptionClient
from config import Config

class PocketOptionClient:
    def __init__(self):
        self.client = None
        
    async def connect(self):
        """Підключення до Pocket Option"""
        self.client = AsyncPocketOptionClient(
            ssid=Config.POCKET_SSID,
            is_demo=Config.POCKET_DEMO,
            enable_logging=False
        )
        await self.client.connect()
        return self
    
    async def get_candles(self, asset, timeframe, count=50):
        """Отримання останніх свічок"""
        try:
            candles = await self.client.get_candles(
                asset=asset,
                timeframe=timeframe,
                count=count
            )
            return candles
        except Exception as e:
            print(f"Error getting candles for {asset}: {e}")
            return None
    
    async def get_balance(self):
        """Отримання балансу"""
        try:
            balance = await self.client.get_balance()
            return balance
        except Exception as e:
            print(f"Error getting balance: {e}")
            return None
    
    async def disconnect(self):
        """Відключення"""
        if self.client:
            await self.client.disconnect()
