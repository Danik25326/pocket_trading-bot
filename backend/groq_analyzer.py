import json
import logging
from groq import Groq
from config import Config

logger = logging.getLogger("signal_bot")

class GroqAnalyzer:
    def __init__(self):
        self.client = None
        self.initialize()
    
    def initialize(self):
        try:
            if not Config.GROQ_API_KEY:
                logger.error("❌ GROQ_API_KEY не знайдено!")
                return
            
            # Створюємо клієнта БЕЗ зайвих параметрів
            self.client = Groq(api_key=Config.GROQ_API_KEY)
            logger.info(f"✅ Groq AI ініціалізовано (модель: {Config.GROQ_MODEL})")
            
            # Додаємо тест запиту для перевірки підключення
            try:
                test_response = self.client.chat.completions.create(
                    model=Config.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": "Тест підключення"},
                        {"role": "user", "content": "Привіт"}
                    ],
                    max_tokens=10
                )
                logger.info("✅ Успішне підключення до Groq AI")
            except Exception as test_error:
                logger.error(f"❌ Критична помилка підключення до Groq: {test_error}")
                raise test_error
                
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації Groq: {e}")
            logger.error("🚫 Система не може працювати без AI. Перевірте API ключ.")
            raise
    
    def analyze_market(self, asset, candles_data):
        """Аналіз ринку через Groq AI - ТІЛЬКИ AI, НІЯКИХ РЕЗЕРВНИХ МЕТОДІВ"""
        if not self.client:
            logger.error("❌ Groq AI не ініціалізовано")
            return None
        
        # Форматуємо дані
        candles_str = self._format_candles_for_analysis(candles_data)
        
        # Поточний час Київ
        now_kyiv = Config.get_kyiv_time()
        
        prompt = f"""
        ТИ - НАЙКРАЩИЙ ТРЕЙДЕР-АНАЛІТИК У СВІТІ З 15-РІЧНИМ ДОСВІДОМ.
        
        ТВОЄ ЗАВДАННЯ: Проаналізувати ринкові дані та видати ТОЧНИЙ торговий сигнал.
        
        АКТИВ: {asset}
        ТАЙМФРЕЙМ: 2 хвилини (120 секунд)
        ПОТОЧНИЙ ЧАС (Київ UTC+2): {now_kyiv.strftime('%H:%M')}
        ДАТА (Київ): {now_kyiv.strftime('%Y-%m-%d')}
        
        ОСТАННІ 20 СВІЧОК (формат: Час | Open | High | Low | Close):
        {candles_str}
        
        ВИКОНАЙ ГЛИБОКИЙ АНАЛІЗ:
        1. ТРЕНДОВИЙ АНАЛІЗ: Визначити основний тренд, його силу та тривалість
        2. РІВНІ ПІДТРИМКИ/ОПОРУ: Знайти точні рівні (до 5 знаків після коми)
        3. ТЕХНІЧНІ ІНДИКАТОРИ: 
           - RSI (перекупленість/перепроданість)
           - MACD (сигнальні лінії, дивергенція)
           - Stochastic (перекупленість/перепроданість)
           - Об'єми (якщо доступні)
        4. СВІЧКОВІ ПАТЕРНИ: 
           - Поглинання (bullish/bearish engulfing)
           - Доджі, молот, падаюча зірка
           - Три ідеальні солдати/ворони
           - Патерн "пінцет"
        5. ВОЛАТИЛЬНІСТЬ: Аналіз амплітуди та зміни вольятільності
        6. РИНКОВИЙ КОНТЕКСТ: Година торгів, економічні новини (врахувати)
        
        КРИТЕРІЇ ДЛЯ СИГНАЛУ:
        - МІНІМАЛЬНА ВПЕВНЕНІСТЬ: 75% (0.75)
        - ЧІТКИЙ ТРЕНД: Напрямок має бути очевидним
        - ПІДТРИМКА ІНДИКАТОРАМИ: Хоча б 2 індикатори мають підтверджувати сигнал
        - СВІЧКОВІ ПАТЕРНИ: Наявність чіткого паттерну
        
        ЯКЩО КРИТЕРІЇ НЕ ВИКОНАНІ - НЕ ДАВАТИ СИГНАЛ!
        
        ФОРМАТ ВІДПОВІДІ (ТІЛЬКИ JSON):
        {{
            "asset": "{asset}",
            "direction": "UP" або "DOWN",
            "confidence": 0.75-0.95,
            "entry_time": "HH:MM (київський час)",
            "duration": 2 або 5,
            "reason": "ДЕТАЛЬНЕ ОБҐРУНТУВАННЯ: тренд, рівні, індикатори, паттерни",
            "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}",
            "timezone": "Europe/Kiev (UTC+2)",
            "analysis_summary": "Короткий висновок аналізу"
        }}
        
        УВАГА: Якщо ринок у флеті або сигнал нечіткий - ПОВЕРНУТИ null
        """
        
        try:
            logger.info(f"🧠 Глибокий AI аналіз для {asset}...")
            
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": """
                        Ти - елітний трейдер-аналітик. 
                        Твої сигнали мають точність 85%+. 
                        Даєш сигнали ТІЛЬКИ коли всі критерії виконані.
                        Не терпи невпевненості - або точний сигнал, або нічого.
                        Використовуй ВИКЛЮЧНО київський час (UTC+2).
                        Формату відповіді - ТІЛЬКИ JSON або null.
                        """
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Низька температура для консистентності
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            
            response_text = completion.choices[0].message.content
            
            # Перевіряємо, чи не повернув AI null
            if response_text.strip().lower() == 'null':
                logger.warning(f"⚠️ AI не дав сигнал для {asset} (ринок нечіткий)")
                return None
            
            response = json.loads(response_text)
            
            # Перевірка обов'язкових полів
            required_fields = ['direction', 'confidence', 'entry_time', 'reason']
            for field in required_fields:
                if field not in response:
                    logger.error(f"❌ AI не повернув обов'язкове поле '{field}' для {asset}")
                    return None
            
            # Додаємо asset, якщо його немає
            if 'asset' not in response:
                response['asset'] = asset
            
            # Додаємо часовий пояс
            response['timezone'] = 'Europe/Kiev (UTC+2)'
            
            # Перевіряємо впевненість
            confidence = response.get('confidence', 0)
            if confidence >= Config.MIN_CONFIDENCE:
                logger.info(f"✅ ТОЧНИЙ сигнал для {asset}: {response['direction']} ({confidence*100:.1f}%)")
                logger.info(f"   📝 Причина: {response['reason'][:100]}...")
                return response
            else:
                logger.warning(f"⚠️ Сигнал для {asset} має низьку впевненість: {confidence*100:.1f}% < {Config.MIN_CONFIDENCE*100}%")
                return None
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ AI повернув невалідний JSON для {asset}: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Помилка AI аналізу для {asset}: {e}")
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
                
                # Форматуємо
                formatted.append(
                    f"{i+1:2d}. {timestamp} | "
                    f"O:{float(open_price):.5f} "
                    f"H:{float(high):.5f} "
                    f"L:{float(low):.5f} "
                    f"C:{float(close):.5f} "
                    f"Change:{((float(close)-float(open_price))/float(open_price)*100):+.2f}%"
                )
            except Exception:
                continue
        
        return "\n".join(formatted) if formatted else "Немає коректних даних свічок"
