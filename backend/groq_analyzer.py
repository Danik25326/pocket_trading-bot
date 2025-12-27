import json
import logging
from groq import Groq
from datetime import datetime
from config import Config

logger = logging.getLogger("signal_bot")

class GroqAnalyzer:
    def __init__(self):
        # Перевіряємо наявність API ключа
        if not Config.GROQ_API_KEY or Config.GROQ_API_KEY == 'your_groq_api_key_here':
            logger.error("❌ GROQ_API_KEY не налаштовано! Перевірте GitHub Secrets")
            self.client = None
        else:
            self.client = Groq(api_key=Config.GROQ_API_KEY)
            logger.info(f"✅ Groq AI ініціалізовано (модель: {Config.GROQ_MODEL})")
        
    def analyze_market(self, asset, candles_data):
        """
        Аналіз ринку через Groq AI
        Повертає сигнал та впевненість
        """
        # Перевіряємо, чи ініціалізовано клієнт
        if not self.client:
            logger.error("Groq AI не ініціалізовано. Пропускаємо аналіз.")
            return None
            
        # Форматуємо дані для AI
        candles_str = self._format_candles(candles_data)
        
        prompt = f"""
        Ти експертний трейдер з бінарними опціонами. Проаналізуй наступні дані:
        
        Актив: {asset}
        Таймфрейм: 2 хвилини
        Останні 50 свічок:
        {candles_str}
        
        Проаналізуй:
        1. Загальний тренд
        2. Рівні підтримки та опору
        3. Ключові технічні індикатори
        4. Волатильність
        
        Дай прогноз на наступні 2-5 хвилин:
        - Напрямок (UP/DOWN)
        - Впевненість у % (70-95%)
        - Рекомендований час входу (HH:MM)
        - Причина
        
        Відповідь дай у JSON форматі:
        {{
            "asset": "{asset}",
            "direction": "UP/DOWN",
            "confidence": 0.85,
            "entry_time": "22:20",
            "reason": "Короткий опис аналізу",
            "timestamp": "2024-01-01 22:15:00"
        }}
        """
        
        try:
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "Ти професійний трейдер бінарних опціонів."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1024,
                response_format={"type": "json_object"}
            )
            
            response = json.loads(completion.choices[0].message.content)
            return response
            
        except Exception as e:
            logger.error(f"Groq AI error: {e}")
            return None
    
    def _format_candles(self, candles):
        """Форматування свічок для AI"""
        if not candles:
            return "Немає даних"
            
        formatted = []
        for i, candle in enumerate(candles[-10:]):  # Беремо останні 10 свічок
            formatted.append(f"""
            Свічка {i+1}:
            Час: {candle.timestamp}
            Open: {candle.open}
            High: {candle.high}
            Low: {candle.low}
            Close: {candle.close}
            Volume: {candle.volume}
            """)
        return "\n".join(formatted)
