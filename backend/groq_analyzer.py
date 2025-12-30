import json
import logging
import os
from groq import Groq
from datetime import datetime, timedelta
import pytz
from config import Config

logger = logging.getLogger("signal_bot")

class GroqAnalyzer:
    def __init__(self):
        if not Config.GROQ_API_KEY or Config.GROQ_API_KEY == 'your_groq_api_key_here':
            logger.error("❌ GROQ_API_KEY не налаштовано! Перевірте GitHub Secrets")
            self.client = None
        else:
            proxy_vars = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']
            for var in proxy_vars:
                os.environ.pop(var, None)
            
            self.client = Groq(api_key=Config.GROQ_API_KEY)
            logger.info(f"✅ Groq AI ініціалізовано (модель: {Config.GROQ_MODEL})")
    
    def calculate_volatility(self, candles):
        """Розрахунок волатильності на основі останніх 10 свічок"""
        if len(candles) < 10:
            return 0.0
        
        recent_candles = candles[-10:]
        closes = [candle.close for candle in recent_candles]
        
        if not closes:
            return 0.0
        
        max_price = max(closes)
        min_price = min(closes)
        avg_price = sum(closes) / len(closes)
        
        if avg_price == 0:
            return 0.0
        
        volatility = ((max_price - min_price) / avg_price) * 100
        return round(volatility, 4)
    
    def get_technical_indicators(self, candles):
        """Розрахунок технічних індикаторів"""
        if len(candles) < 10:
            return {}
        
        closes = [candle.close for candle in candles]
        
        # Проста середня (SMA)
        sma_5 = sum(closes[-5:]) / 5 if len(closes) >= 5 else closes[-1]
        sma_10 = sum(closes[-10:]) / 10 if len(closes) >= 10 else closes[-1]
        
        # Визначення тренду
        trend = "NEUTRAL"
        if sma_5 > sma_10:
            trend = "UP"
        elif sma_5 < sma_10:
            trend = "DOWN"
        
        # Поточна ціна
        current_price = closes[-1] if closes else 0
        
        return {
            "sma_5": round(sma_5, 5),
            "sma_10": round(sma_10, 5),
            "trend": trend,
            "current_price": round(current_price, 5)
        }
    
    def analyze_market(self, asset, candles_data):
        """
        Аналіз ринку через GPT OSS 120B AI
        """
        if not self.client:
            logger.error("Groq AI не ініціалізовано. Пропускаємо аналіз.")
            return None
        
        # Отримуємо історію для навчання
        feedback = self._get_learning_feedback(asset)
        feedback_str = self._format_feedback_for_prompt(feedback)
        
        # Розраховуємо технічні показники
        technical_indicators = self.get_technical_indicators(candles_data)
        volatility = self.calculate_volatility(candles_data)
        
        # Форматуємо дані
        candles_str = self._format_candles(candles_data)
        
        # Київський час
        now_kyiv = Config.get_kyiv_time()
        
        # Визначаємо час входу (через 1-2 хвилини)
        import random
        minutes_to_add = random.randint(1, 2)
        entry_time_dt = now_kyiv + timedelta(minutes=minutes_to_add)
        entry_time = entry_time_dt.strftime('%H:%M')
        entry_timestamp = entry_time_dt.isoformat()
        
        # Визначаємо тривалість на основі волатильності
        base_duration = 2
        if volatility > 0.5:
            base_duration = random.randint(1, 2)  # Висока волатильність
        elif volatility > 0.2:
            base_duration = random.randint(3, 4)  # Середня волатильність
        else:
            base_duration = 5  # Низька волатильність
        
        prompt = f"""
        Ти експертний трейдер з бінарними опціонами з 10-річним досвідом. Проаналізуй наступні дані:

        Актив: {asset}
        Таймфрейм: 2 хвилини
        Поточний час (Київ): {now_kyiv.strftime('%H:%M:%S')}
        Волатильність останніх 10 свічок: {volatility:.4f}%
        
        Технічні показники:
        - SMA 5: {technical_indicators.get('sma_5', 0):.5f}
        - SMA 10: {technical_indicators.get('sma_10', 0):.5f}
        - Поточна ціна: {technical_indicators.get('current_price', 0):.5f}
        - Визначений тренд: {technical_indicators.get('trend', 'NEUTRAL')}

        Останні 50 свічок (2-хвилинні):
        {candles_str}

        Історія успішних/невдалих сигналів для цього активу (для навчання):
        {feedback_str}

        ПРОВЕДІТЬ ПОВНИЙ ТЕХНІЧНИЙ АНАЛІЗ:

        1. ТРЕНД:
           - Загальний напрямок (вгору/вниз/флет)
           - Сила тренду (сильний/помірний/слабкий)
           - Чи є зміна тренду?

        2. КЛЮЧОВІ РІВНІ:
           - Найближчий рівень підтримки
           - Найближчий рівень опору
           - Як далеко від поточної ціни?

        3. ТЕХНІЧНІ ІНДИКАТОРИ:
           - RSI (перекупленість/перепроданість)
           - MACD (схрещення, дивергенція)
           - Stochastic (положення %K та %D)
           - Ковзні середні (SMA 5, SMA 10)

        4. СВІЧКОВІ ПАТЕРНИ:
           - Визнач японські свічкові паттерни
           - Потенційні розворотні сигнали

        5. ВОЛАТИЛЬНІСТЬ ТА ОБСЯГИ:
           - Поточна волатильність ({volatility:.4f}%)
           - Зростають чи падають обсяги?
           - Чи є сплеск активності?

        ДАЙ ПРОГНОЗ НА НАСТУПНІ 2-5 ХВИЛИН:

        Напрямок: [UP/DOWN]
        Впевненість: [70-95%]
        Час входу: [HH:MM] (через 1-2 хвилини від поточного часу)
        Тривалість угоди: [1-5 хв] - ОБЕРІТЬ НА ОСНОВІ ВОЛАТИЛЬНОСТІ!

        ОБҐРУНТУВАННЯ: [Детальний аналіз українською мовою]

        ВАЖЛИВІ ПРАВИЛА:
        1. Якщо тренд неясний (флет) - НЕ давай сигнал
        2. Мінімальна впевненість: 70%
        3. Максимальна тривалість: 5 хвилин
        4. ВИБІР ТРИВАЛОСТІ:
           - Висока волатильність (>0.5%) → 1-2 хвилини
           - Середня волатильність (0.2-0.5%) → 3-4 хвилини  
           - Низька волатильність (<0.2%) → 5 хвилин
        5. Використовуй історію сигналів для покращення точності

        ВІДПОВІДЬ ПОВИННА БУТИ У JSON ФОРМАТІ:
        {{
            "asset": "{asset}",
            "direction": "UP/DOWN",
            "confidence": 0.85,
            "entry_time": "{entry_time}",
            "entry_timestamp": "{entry_timestamp}",
            "duration": {base_duration},  # ЗАПОВНИ на основі волатильності!
            "reason": "Детальний аналіз українською мовою з обґрунтуванням прогнозу",
            "reason_ru": "Детальный анализ на русском языке с обоснованием прогноза",
            "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}"
        }}
        
        УВАГА: Тривалість угоди має бути в межах 1-5 хвилин на основі волатильності!
        """
        
        try:
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "Ти професійний трейдер бінарних опціонів. Використовуй історію для покращення точності. Не давай тривалість більше 5 хвилин. Відповідай тільки у JSON форматі."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            response = json.loads(completion.choices[0].message.content)
            
            # Додаємо додаткові поля
            response['generated_at'] = now_kyiv.isoformat()
            response['generated_at_utc'] = datetime.utcnow().isoformat() + 'Z'
            response['volatility'] = volatility
            response['id'] = f"{asset}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
            
            # Перевіряємо тривалість
            duration = response.get('duration', base_duration)
            if duration > Config.MAX_DURATION:
                response['duration'] = Config.MAX_DURATION
                logger.warning(f"⚠️ Обмежено тривалість для {asset}: {duration} → {Config.MAX_DURATION}")
            
            logger.info(f"✅ AI повернув сигнал для {asset}: {response['direction']} ({response['confidence']*100:.1f}%)")
            return response
            
        except Exception as e:
            logger.error(f"Groq AI error: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    def _format_candles(self, candles):
        """Форматування свічок для AI"""
        if not candles or len(candles) == 0:
            return "Немає даних"
        
        formatted = []
        # Беремо останні 15 свічок для аналізу
        for i, candle in enumerate(candles[-15:]):
            if hasattr(candle, 'timestamp'):
                time_str = candle.timestamp.strftime('%H:%M')
            else:
                time_str = f"Свічка {i+1}"
            
            formatted.append(f"""
            {time_str}:
            Open: {candle.open:.5f}
            High: {candle.high:.5f}
            Low: {candle.low:.5f}
            Close: {candle.close:.5f}
            Volume: {getattr(candle, 'volume', 0):.0f}
            """)
        return "\n".join(formatted)
    
    def _get_learning_feedback(self, asset):
        """Отримання історії успішних/невдалих сигналів для навчання"""
        try:
            from data_handler import DataHandler
            handler = DataHandler()
            return handler.get_feedback_history(asset)
        except Exception as e:
            logger.error(f"Помилка отримання feedback: {e}")
            return []
    
    def _format_feedback_for_prompt(self, feedback):
        """Форматування зворотного зв'язку для prompt"""
        if not feedback:
            return "Немає історії для навчання."
        
        formatted = []
        for item in feedback[-5:]:
            result = "✅ УСПІШНО" if item.get('success') else "❌ НЕУСПІШНО"
            direction = item.get('direction', 'N/A')
            reason = item.get('reason', '')[:100] + '...' if len(item.get('reason', '')) > 100 else item.get('reason', '')
            
            formatted.append(f"- {direction} ({result}): {reason}")
        
        return "\n".join(formatted)
