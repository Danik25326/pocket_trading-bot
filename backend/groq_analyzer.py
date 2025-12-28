import json
import logging
import os
from datetime import datetime
import pytz
from config import Config

# Спрощений імпорт Groq без проксі
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except Exception as e:
    logging.error(f"Помилка імпорту Groq: {e}")
    GROQ_AVAILABLE = False

logger = logging.getLogger("signal_bot")

class GroqAnalyzer:
    def __init__(self):
        self.client = None
        self.initialize()
    
    def initialize(self):
        """Ініціалізація Groq клієнта без проксі"""
        try:
            if not Config.GROQ_API_KEY or Config.GROQ_API_KEY == 'your_groq_api_key_here':
                logger.error("❌ GROQ_API_KEY не налаштовано!")
                return
            
            if not GROQ_AVAILABLE:
                logger.error("❌ Бібліотека Groq недоступна")
                return
            
            logger.info(f"🧠 Ініціалізація Groq AI (модель: {Config.GROQ_MODEL})...")
            
            # Створюємо клієнта без будь-яких додаткових параметрів
            self.client = Groq(api_key=Config.GROQ_API_KEY)
            logger.info("✅ Groq AI успішно ініціалізовано")
            
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації Groq: {e}")
    
    def analyze_market(self, asset, candles_data):
        """Аналіз ринку через Groq AI з Київським часом"""
        if not self.client:
            logger.error("Groq AI не ініціалізовано")
            return None
        
        # Отримуємо Київський час
        kyiv_tz = pytz.timezone('Europe/Kiev')
        now_kyiv = datetime.now(kyiv_tz)
        current_time_str = now_kyiv.strftime("%H:%M")
        current_date_str = now_kyiv.strftime("%Y-%m-%d")
        
        # Форматуємо дані свічок
        candles_str = self._format_candles_for_analysis(candles_data)
        
        # ОБНОВЛЕНИЙ ПРОМПТ з акцентом на Київський час
        prompt = f"""
        Ти - професійний трейдер бінарних опціонів з 15-річним досвідом.
        Твоє завдання - проаналізувати ринкові дані та дати торговий сигнал.
        
        ВАЖЛИВО: ВСІ ЧАСИ МАЮТЬ БУТИ В КИЇВСЬКОМУ ЧАСІ (UTC+2)!
        
        ІНФОРМАЦІЯ:
        - Актив: {asset}
        - Таймфрейм: 2 хвилини
        - Поточний київський час: {current_time_str}
        - Поточна дата: {current_date_str}
        
        ДАНІ СВІЧОК (останні 20):
        {candles_str}
        
        ПРОАНАЛІЗУЙ:
        1. ЗАГАЛЬНИЙ ТРЕНД: Визнач основний тренд (вгору/вниз/боковик)
        2. КЛЮЧОВІ РІВНІ: Знайди рівні підтримки та опору
        3. ТЕХНІЧНІ ІНДИКАТОРИ: 
           - RSI: чи є перекупленість/перепроданість
           - MACD: напрямок тренду
           - Stochastic: сигнали купівлі/продажу
        4. СВІЧКОВІ ПАТЕРНИ: Поглинання, молот, падаюча зірка тощо
        5. ВОЛАТИЛЬНІСТЬ: Активність ринку
        
        НА ОСНОВІ АНАЛІЗУ ДАЙ СИГНАЛ:
        - Напрямок: UP (купувати) або DOWN (продавати)
        - Впевненість: від 70 до 95% (десятичний дріб)
        - Час входу: наступні 1-2 хвилини (формат HH:MM, Київський час!)
        - Тривалість: 2 або 5 хвилин (обери оптимальну)
        - Причина: коротке обґрунтування (2-3 речення)
        
        ВИМОГИ:
        1. Якщо тренд неясний - не давай сигнал
        2. Мінімальна впевненість: 70%
        3. Час входу має бути в майбутньому відносно поточного часу
        4. Всі часи тільки в Київському часі (UTC+2)
        
        ПРИКЛАД ВІДПОВІДІ (JSON):
        {{
            "asset": "{asset}",
            "direction": "UP",
            "confidence": 0.82,
            "entry_time": "{(now_kyiv.replace(second=0, microsecond=0).replace(minute=now_kyiv.minute + 1)).strftime('%H:%M')}",
            "duration": 2,
            "reason": "Чіткий паттерн поглинання на ключовому рівні підтримки 231.50. RSI показує перепроданість з розворотом вгору, MACD готується до перетину в позитивну зону.",
            "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}"
        }}
        """
        
        try:
            logger.info(f"🧠 Аналізую {asset} через Groq AI...")
            
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Ти професійний трейдер бінарних опціонів. Твої аналізи точні та обґрунтовані. Ти використовуєш технічний аналіз та свічкові паттерни. Всі часи вказуєш в Київському часовому поясі (UTC+2)."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            
            response = json.loads(completion.choices[0].message.content)
            
            # Перевірка та доповнення відповіді
            response['asset'] = asset
            
            # Додаємо Київський час генерації
            response['generated_at'] = now_kyiv.isoformat()
            response['timezone'] = 'Europe/Kiev (UTC+2)'
            
            # Перевіряємо впевненість
            if response.get('confidence', 0) >= Config.MIN_CONFIDENCE:
                logger.info(f"✅ Сигнал для {asset}: {response['direction']} ({response['confidence']*100:.1f}%) на {response.get('entry_time', 'N/A')}")
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
        # Беремо останні 20 свічок для аналізу
        for i, candle in enumerate(candles[-20:]):
            try:
                # Обробляємо різні формати свічок
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
                elif isinstance(candle, (list, tuple)) and len(candle) >= 5:
                    timestamp = candle[0]
                    open_price = candle[1]
                    high = candle[2]
                    low = candle[3]
                    close = candle[4]
                else:
                    continue
                
                # Форматуємо для читабельності
                formatted.append(
                    f"{i+1:2d}. Час: {timestamp} | "
                    f"Відкриття: {float(open_price):.5f} | "
                    f"Максимум: {float(high):.5f} | "
                    f"Мінімум: {float(low):.5f} | "
                    f"Закриття: {float(close):.5f}"
                )
            except Exception as e:
                continue
        
        if formatted:
            return "\n".join(formatted)
        else:
            return "Немає коректних даних свічок"
