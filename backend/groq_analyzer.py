import json
import logging
import os
from groq import Groq
from datetime import datetime, timedelta
from config import Config

logger = logging.getLogger("signal_bot")

class GroqAnalyzer:
    def __init__(self):
        if not Config.GROQ_API_KEY:
            logger.error("❌ GROQ_API_KEY не налаштовано!")
            self.client = None
        else:
            proxy_vars = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']
            for var in proxy_vars:
                os.environ.pop(var, None)
            
            self.client = Groq(api_key=Config.GROQ_API_KEY)
            logger.info(f"✅ Groq AI ініціалізовано (модель: {Config.GROQ_MODEL})")
    
    def calculate_volatility(self, candles):
        """Розрахунок волатильності"""
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
    
    def analyze_market(self, asset, candles_data, language='uk'):
        """
        Аналіз ринку через GPT OSS 120B AI з підтримкою мов
        """
        if not self.client:
            logger.error("Groq AI не ініціалізовано.")
            return None
        
        if not candles_data or len(candles_data) < 10:
            logger.error(f"Недостатньо даних для {asset}")
            return None
        
        volatility = self.calculate_volatility(candles_data)
        now_kyiv = Config.get_kyiv_time()
        
        # Фіксований час входу через 2 хвилини
        entry_time_dt = now_kyiv + timedelta(minutes=2)
        entry_time = entry_time_dt.strftime('%H:%M')
        
        # Тривалість за волатильністю (2-3 хвилини)
        if volatility > 0.5:
            duration = 2
        else:
            duration = 3
        
        # Формуємо дані про свічки
        candles_str = ""
        for i, candle in enumerate(candles_data[-8:]):
            time_str = candle.timestamp.strftime('%H:%M') if hasattr(candle, 'timestamp') else f"{i+1}"
            candles_str += f"{time_str}: O={candle.open:.5f} C={candle.close:.5f}\n"
        
        # Дуже простий промпт, як у робочому коді
        if language == 'ru':
            prompt = f"""
Актив: {asset}
Таймфрейм: 1 минута
Текущее время: {now_kyiv.strftime('%H:%M:%S')}
Волатильность: {volatility:.2f}%

Последние свечи:
{candles_str}

Проанализируй RSI, MACD, Bollinger Bands, EMA 9/21, Stochastic, тренд и свечные паттерны.
Минимальная уверенность: 75%
Длительность: {duration} мин
Время входа: {entry_time}

Ответ в JSON:
{{
    "asset": "{asset}",
    "direction": "UP или DOWN",
    "confidence": 0.85,
    "entry_time": "{entry_time}",
    "duration": {duration},
    "reason": "Краткий анализ",
    "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}"
}}
"""
        else:
            prompt = f"""
Актив: {asset}
Таймфрейм: 1 хвилина
Поточний час: {now_kyiv.strftime('%H:%M:%S')}
Волатильність: {volatility:.2f}%

Останні свічки:
{candles_str}

Проаналізуй RSI, MACD, Bollinger Bands, EMA 9/21, Stochastic, тренд та свічкові патерни.
Мінімальна впевненість: 75%
Тривалість: {duration} хв
Час входу: {entry_time}

Відповідь у JSON:
{{
    "asset": "{asset}",
    "direction": "UP або DOWN",
    "confidence": 0.85,
    "entry_time": "{entry_time}",
    "duration": {duration},
    "reason": "Короткий аналіз",
    "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}"
}}
"""
        
        try:
            logger.info(f"🧠 Аналіз через {Config.GROQ_MODEL} для {asset}...")
            
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "Ти трейдер. Відповідай у JSON."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=400,
                response_format={"type": "json_object"}
            )
            
            response_text = completion.choices[0].message.content
            logger.debug(f"AI відповідь: {response_text[:200]}...")
            
            response = json.loads(response_text)
            
            # Перевірка обов'язкових полів
            required_fields = ['asset', 'direction', 'confidence', 'entry_time', 'duration']
            for field in required_fields:
                if field not in response:
                    logger.error(f"⚠️ Відповідь AI не містить поле {field}")
                    return None
            
            # Додаємо додаткові поля
            response['generated_at'] = now_kyiv.isoformat()
            response['volatility'] = volatility
            response['id'] = f"{asset}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
            
            # Перевірка впевненості
            confidence = response.get('confidence', 0)
            if confidence < Config.MIN_CONFIDENCE:
                logger.warning(f"⚠️ Сигнал для {asset} має низьку впевненість: {confidence*100:.1f}% < {Config.MIN_CONFIDENCE*100}%")
                return None
            
            logger.info(f"✅ AI повернув сигнал для {asset}: {response['direction']} ({confidence*100:.1f}%)")
            return response
            
        except Exception as e:
            logger.error(f"❌ Groq AI error: {e}")
            logger.info("🔄 Створення простого сигналу через резервний метод...")
            return self._create_simple_signal(asset, candles_data, volatility, entry_time, duration, now_kyiv, language)
    
    def _create_simple_signal(self, asset, candles_data, volatility, entry_time, duration, now_kyiv, language='uk'):
        """Резервний метод створення простого сигналу"""
        # Проста логіка на основі останніх 5 свічок
        if len(candles_data) < 5:
            return None
        
        last_5_closes = [candle.close for candle in candles_data[-5:]]
        if not last_5_closes:
            return None
        
        # Перевіряємо тренд
        first_price = last_5_closes[0]
        last_price = last_5_closes[-1]
        
        if last_price > first_price:
            direction = "UP"
            confidence = 0.75
            if language == 'ru':
                reason = f"Восходящий тренд. Волатильность: {volatility:.2f}%"
            else:
                reason = f"Тренд вгору. Волатильність: {volatility:.2f}%"
        elif last_price < first_price:
            direction = "DOWN"
            confidence = 0.75
            if language == 'ru':
                reason = f"Нисходящий тренд. Волатильность: {volatility:.2f}%"
            else:
                reason = f"Тренд вниз. Волатильність: {volatility:.2f}%"
        else:
            return None
        
        return {
            "asset": asset,
            "direction": direction,
            "confidence": confidence,
            "entry_time": entry_time,
            "duration": duration,
            "reason": reason,
            "timestamp": now_kyiv.strftime('%Y-%m-%d %H:%M:%S'),
            "generated_at": now_kyiv.isoformat(),
            "volatility": volatility,
            "id": f"{asset}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
        }
