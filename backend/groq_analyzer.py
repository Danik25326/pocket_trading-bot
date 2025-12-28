import json
import logging
import os
from datetime import datetime
import pytz
from config import Config

logger = logging.getLogger("signal_bot")

class GroqAnalyzer:
    def __init__(self):
        self.client = None
        self.initialize()
    
    def initialize(self):
        """Ініціалізація Groq клієнта без проблем із proxies"""
        try:
            if not Config.GROQ_API_KEY or Config.GROQ_API_KEY == 'your_groq_api_key_here':
                logger.error("❌ GROQ_API_KEY не налаштовано!")
                return
            
            logger.info(f"🧠 Ініціалізація Groq AI (модель: {Config.GROQ_MODEL})...")
            
            # Видаляємо змінні проксі з середовища перед імпортом
            for proxy_var in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']:
                os.environ.pop(proxy_var, None)
            
            # Імпортуємо Groq ПОСЛЯ видалення змінних середовища
            from groq import Groq
            
            # Створюємо клієнта ТІЛЬКИ з api_key
            self.client = Groq(
                api_key=Config.GROQ_API_KEY,
                # Не передаємо жодних додаткових параметрів
            )
            
            logger.info("✅ Groq AI успішно ініціалізовано")
            
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації Groq: {e}")
            logger.error(f"API Key присутній: {'✅' if Config.GROQ_API_KEY and Config.GROQ_API_KEY != 'your_groq_api_key_here' else '❌'}")
    
    def analyze_market(self, asset, candles_data):
        """Аналіз ринку через Groq AI з Київським часом"""
        if not self.client:
            logger.error("Groq AI не ініціалізовано")
            return None
        
        # Отримуємо Київський час
        kyiv_tz = pytz.timezone('Europe/Kiev')
        now_kyiv = datetime.now(kyiv_tz)
        current_time_str = now_kyiv.strftime("%H:%M")
        
        # Форматуємо дані свічок
        candles_str = self._format_candles_for_analysis(candles_data)
        
        # Оптимізований промпт
        prompt = f"""
        Ти професійний трейдер. Проаналізуй наступні дані:
        
        Актив: {asset}
        Таймфрейм: 2 хвилини
        Поточний час (Київ UTC+2): {current_time_str}
        
        Останні свічки:
        {candles_str}
        
        Проаналізуй тренд, рівні підтримки/опору, технічні індикатори.
        
        Дай сигнал у форматі JSON:
        {{
            "asset": "{asset}",
            "direction": "UP або DOWN",
            "confidence": 0.85,
            "entry_time": "{current_time_str}",
            "duration": 2,
            "reason": "Короткий аналіз",
            "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}"
        }}
        
        ВАЖЛИВО:
        - Якщо тренд неясний - не давай сигнал
        - Мінімальна впевненість: 70%
        - Всі часи в Київському поясі (UTC+2)
        """
        
        try:
            logger.info(f"🧠 Аналізую {asset} через Groq AI...")
            
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Ти трейдер бінарних опціонів. Даєш чіткі сигнали. Використовуй Київський час (UTC+2)."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            response = json.loads(completion.choices[0].message.content)
            
            # Додаємо час генерації
            response['generated_at'] = now_kyiv.isoformat()
            response['timezone'] = 'Europe/Kiev (UTC+2)'
            response['asset'] = asset
            
            # Перевіряємо впевненість
            if response.get('confidence', 0) >= Config.MIN_CONFIDENCE:
                logger.info(f"✅ Сигнал для {asset}: {response['direction']} ({response['confidence']*100:.1f}%)")
                return response
            else:
                logger.warning(f"⚠️ Низька впевненість для {asset}: {response.get('confidence', 0)*100:.1f}%")
                return None
            
        except Exception as e:
            logger.error(f"❌ Помилка Groq AI для {asset}: {e}")
            return None
    
    def _format_candles_for_analysis(self, candles):
        """Форматування свічок для аналізу"""
        if not candles:
            return "Немає даних"
        
        formatted = []
        for i, candle in enumerate(candles[-15:]):  # Беремо останні 15 свічок
            try:
                if hasattr(candle, 'close'):
                    close = candle.close
                    open_price = candle.open
                    high = candle.high
                    low = candle.low
                    timestamp = getattr(candle, 'timestamp', 'N/A')
                elif isinstance(candle, dict):
                    close = candle.get('close', 0)
                    open_price = candle.get('open', 0)
                    high = candle.get('high', 0)
                    low = candle.get('low', 0)
                    timestamp = candle.get('timestamp', 'N/A')
                else:
                    continue
                
                formatted.append(
                    f"{i+1}. {timestamp} | O:{open_price:.5f} H:{high:.5f} L:{low:.5f} C:{close:.5f}"
                )
            except Exception:
                continue
        
        return "\n".join(formatted) if formatted else "Немає коректних даних"
