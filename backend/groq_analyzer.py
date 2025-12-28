import json
import logging
from datetime import datetime
import pytz
from config import Config

logger = logging.getLogger("signal_bot")

class GroqAnalyzer:
    def __init__(self):
        self.client = None
        self.kyiv_tz = pytz.timezone('Europe/Kiev')
        self.initialize()
    
    def initialize(self):
        """Найпростіша ініціалізація Groq"""
        try:
            if not Config.GROQ_API_KEY:
                logger.error("❌ GROQ_API_KEY не знайдено!")
                return
            
            # Імпортуємо тут, щоб уникнути проблем
            from groq import Groq
            
            self.client = Groq(api_key=Config.GROQ_API_KEY)
            logger.info(f"✅ Groq AI ініціалізовано")
            
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації Groq: {e}")
    
    def analyze_market(self, asset, candles_data):
        """Дуже простий аналіз"""
        if not self.client:
            logger.error("Groq AI не ініціалізовано")
            return None
        
        # Київський час
        now_kyiv = datetime.now(self.kyiv_tz)
        
        # Дуже простий промпт
        prompt = f"""
        Актив: {asset}
        Час (Київ): {now_kyiv.strftime('%H:%M')}
        
        Проаналізуй тренд та дай сигнал:
        - UP або DOWN
        - Впевненість 0.7-0.95
        
        JSON формат:
        {{
            "asset": "{asset}",
            "direction": "UP",
            "confidence": 0.85,
            "entry_time": "{now_kyiv.strftime('%H:%M')}",
            "duration": 2,
            "reason": "Короткий аналіз",
            "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}"
        }}
        """
        
        try:
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "Ти трейдер. Даєш сигнали."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=300,
                response_format={"type": "json_object"}
            )
            
            response = json.loads(completion.choices[0].message.content)
            response['generated_at'] = now_kyiv.isoformat()
            response['timezone'] = 'Europe/Kiev'
            
            if response.get('confidence', 0) >= Config.MIN_CONFIDENCE:
                return response
            
            return None
            
        except Exception as e:
            logger.error(f"Помилка AI: {e}")
            return None
