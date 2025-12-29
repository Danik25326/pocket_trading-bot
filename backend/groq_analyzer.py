import json
import logging
import os
from groq import Groq
from datetime import datetime, timedelta
from config import Config

logger = logging.getLogger("signal_bot")

class GroqAnalyzer:
    def __init__(self):
        # Перевіряємо наявність API ключа
        if not Config.GROQ_API_KEY or Config.GROQ_API_KEY == 'your_groq_api_key_here':
            logger.error("❌ GROQ_API_KEY не налаштовано! Перевірте GitHub Secrets")
            self.client = None
        else:
            # Видаляємо змінні проксі з оточення
            proxy_vars = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']
            for var in proxy_vars:
                os.environ.pop(var, None)
            
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
            
        # Отримуємо історію успішних сигналів для навчання
        feedback = self._get_learning_feedback(asset)
        feedback_str = self._format_feedback_for_prompt(feedback)
        
        # Форматуємо дані для AI
        candles_str = self._format_candles(candles_data)
        
        # Розраховуємо волатильність для вибору тривалості
        volatility = self._calculate_volatility(candles_data)
        
        # Київський час
        now_kyiv = Config.get_kyiv_time()
        # Час входу через 1-2 хвилини
        entry_time = (now_kyiv + timedelta(minutes=2)).strftime('%H:%M')
        
        prompt = f"""
        Ти експертний трейдер з бінарними опціонами. Проаналізуй наступні дані:
        
        Актив: {asset}
        Таймфрейм: 2 хвилини
        Поточний час (Київ): {now_kyiv.strftime('%H:%M')}
        Волатильність: {volatility:.4f}%
        
        Останні 50 свічок:
        {candles_str}
        
        Історія успішних/невдалих сигналів для цього активу (для навчання):
        {feedback_str}
        
        Проаналізуй:
        1. Загальний тренд (вгору/вниз/флет)
        2. Рівні підтримки та опору
        3. Ключові технічні індикатори (RSI, MACD, Stochastic)
        4. Волатильність
        5. Японські свічкові паттерни
        
        Дай прогноз на наступні 2-5 хвилин:
        - Напрямок (UP/DOWN)
        - Впевненість у % (70-95%)
        - Рекомендований час входу (HH:MM) - через 1-2 хвилини від поточного часу
        - Тривалість угоди (1, 2, 3, 4 або 5 хвилин, але не більше 5)
        - Коротке обґрунтування
        
        ВАЖЛИВО:
        - Якщо тренд неясний або ринок у флеті - не давай сигнал
        - Мінімальна впевненість: 70%
        - Час входу має бути в майбутньому (через 1-2 хвилини)
        - ВИБЕРІТЬ ТРИВАЛІСТЬ НА ОСНОВІ ВОЛАТИЛЬНОСТІ:
          * Висока волатильність (>0.5%) → оберіть 1-2 хвилини
          * Середня волатильність (0.2-0.5%) → оберіть 3-4 хвилини  
          * Низька волатильність (<0.2%) → оберіть 5 хвилин
          * НІКОЛИ не більше 5 хвилин
        - Використовуй історію для покращення точності
        
        Відповідь дай у JSON форматі:
        {{
            "asset": "{asset}",
            "direction": "UP/DOWN",
            "confidence": 0.85,
            "entry_time": "{entry_time}",
            "duration": 2,  # ЗАПОВНИ на основі волатильності!
            "reason": "Короткий опис аналізу",
            "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}"
        }}
        """
        
        try:
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "Ти професійний трейдер бінарних опціонів. Використовуй історію для покращення точності. Обирай тривалість угоди на основі волатильності: висока → 1-2 хв, середня → 3-4 хв, низька → 5 хв. Не давай тривалість більше 5 хвилин."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1024,
                response_format={"type": "json_object"}
            )
            
            response = json.loads(completion.choices[0].message.content)
            response['generated_at'] = now_kyiv.isoformat()
            
            # Додаємо волатильність до відповіді для логування
            response['volatility'] = volatility
            
            logger.info(f"📊 Аналіз для {asset}: волатильність={volatility:.4f}%, тривалість={response.get('duration', 2)} хв")
            
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
    
    def _calculate_volatility(self, candles):
        """Розрахунок волатильності на основі останніх свічок"""
        try:
            if not candles or len(candles) < 10:
                return 0.3  # Середня волатильність за замовчуванням
            
            # Беремо останні 10 свічок для розрахунку
            recent_candles = candles[-10:]
            
            # Розраховуємо денний діапазон для кожної свічки
            ranges = []
            for candle in recent_candles:
                if hasattr(candle, 'high') and hasattr(candle, 'low'):
                    candle_range = (candle.high - candle.low) / candle.low * 100  # Відсотковий діапазон
                    ranges.append(candle_range)
            
            if not ranges:
                return 0.3
            
            # Середня волатильність
            avg_volatility = sum(ranges) / len(ranges)
            
            return avg_volatility
            
        except Exception as e:
            logger.warning(f"⚠️ Помилка розрахунку волатильності: {e}")
            return 0.3
    
    def _get_learning_feedback(self, asset):
        """Отримання історії успішних/невдалих сигналів для навчання"""
        try:
            from data_handler import DataHandler
            handler = DataHandler()
            return handler.get_feedback_history(asset)
        except:
            return []
    
    def _format_feedback_for_prompt(self, feedback):
        """Форматування зворотного зв'язку для prompt"""
        if not feedback:
            return "Немає історії для навчання."
        
        formatted = []
        for item in feedback[-5:]:  # Останні 5 записів
            result = "✅ УСПІШНО" if item.get('success') else "❌ НЕУСПІШНО"
            formatted.append(f"- {item.get('asset')}: {item.get('direction')} ({result}) - {item.get('reason', '')}")
        
        return "\n".join(formatted)
