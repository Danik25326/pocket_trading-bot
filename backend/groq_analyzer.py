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
        
        # Розраховуємо базові технічні індикатори
        technical_indicators = self._calculate_technical_indicators(candles_data)
        
        # Київський час
        now_kyiv = Config.get_kyiv_time()
        # Час входу через 1-2 хвилини
        entry_time = (now_kyiv + timedelta(minutes=2)).strftime('%H:%M')
        
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
            "duration": 2,  # ЗАПОВНИ на основі волатильності!
            "reason": "Детальний аналіз українською мовою з обґрунтуванням прогнозу",
            "timestamp": "{now_kyiv.strftime('%Y-%m-%d %H:%M:%S')}"
        }}
        """
        
        try:
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "Ти професійний трейдер бінарних опціонів з 10-річним досвідом. Використовуй технічний аналіз, свічкові паттерни та історію для точних прогнозів. Обирай тривалість угоди на основі волатильності. Давай сигнали лише при чіткому тренді. Завжди надавай детальне обґрунтування українською мовою."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1024,
                response_format={"type": "json_object"}
            )
            
            response = json.loads(completion.choices[0].message.content)
            response['generated_at'] = now_kyiv.isoformat()
            
            # Додаємо волатильність та технічні показники до відповіді для логування
            response['volatility'] = volatility
            response['technical_indicators'] = technical_indicators
            
            # Логування детальної інформації
            logger.info(f"📊 Аналіз для {asset}:")
            logger.info(f"   Волатильність: {volatility:.4f}%")
            logger.info(f"   Тренд: {technical_indicators.get('trend', 'NEUTRAL')}")
            logger.info(f"   SMA 5/10: {technical_indicators.get('sma_5', 0):.5f}/{technical_indicators.get('sma_10', 0):.5f}")
            logger.info(f"   Напрямок: {response.get('direction', 'N/A')}")
            logger.info(f"   Впевненість: {response.get('confidence', 0)*100:.1f}%")
            logger.info(f"   Тривалість: {response.get('duration', 2)} хв")
            logger.info(f"   Час входу: {response.get('entry_time', 'N/A')}")
            
            return response
            
        except Exception as e:
            logger.error(f"Groq AI error: {e}")
            return None
    
    def _format_candles(self, candles):
        """Форматування свічок для AI"""
        if not candles:
            return "Немає даних"
            
        # Беремо останні 15 свічок для більш детального аналізу
        formatted = []
        for i, candle in enumerate(candles[-15:]):
            time_str = candle.timestamp.strftime('%H:%M') if hasattr(candle.timestamp, 'strftime') else str(candle.timestamp)
            formatted.append(f"""
            Свічка {i+1} ({time_str}):
            Відкриття: {candle.open:.5f}
            Максимум: {candle.high:.5f}
            Мінімум: {candle.low:.5f}
            Закриття: {candle.close:.5f}
            Об'єм: {candle.volume if hasattr(candle, 'volume') else 'N/A'}
            Діапазон: {(candle.high - candle.low):.5f} ({(candle.high - candle.low)/candle.low*100:.2f}%)
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
                if hasattr(candle, 'high') and hasattr(candle, 'low') and candle.low != 0:
                    candle_range = (candle.high - candle.low) / candle.low * 100  # Відсотковий діапазон
                    ranges.append(candle_range)
            
            if not ranges:
                return 0.3
            
            # Середня волатильність
            avg_volatility = sum(ranges) / len(ranges)
            
            # Класифікація волатильності
            if avg_volatility > 0.5:
                volatility_class = "ВИСОКА"
            elif avg_volatility > 0.2:
                volatility_class = "СЕРЕДНЯ"
            else:
                volatility_class = "НИЗЬКА"
            
            logger.info(f"📈 Волатильність для аналізу: {avg_volatility:.4f}% ({volatility_class})")
            
            return avg_volatility
            
        except Exception as e:
            logger.warning(f"⚠️ Помилка розрахунку волатильності: {e}")
            return 0.3
    
    def _calculate_technical_indicators(self, candles):
        """Розрахунок простих технічних індикаторів"""
        try:
            if len(candles) < 10:
                return {
                    "sma_5": 0,
                    "sma_10": 0,
                    "trend": "NEUTRAL",
                    "volatility": 0,
                    "current_price": candles[-1].close if candles else 0
                }
            
            # Беремо закриття останніх свічок
            closes = [candle.close for candle in candles]
            
            # Проста ковзна середня (SMA)
            if len(closes) >= 5:
                sma_5 = sum(closes[-5:]) / 5
            else:
                sma_5 = sum(closes) / len(closes)
            
            if len(closes) >= 10:
                sma_10 = sum(closes[-10:]) / 10
            else:
                sma_10 = sum(closes) / len(closes)
            
            # Визначення тренду
            trend = "NEUTRAL"
            if sma_5 > sma_10 * 1.001:  # +0.1% різниця
                trend = "UP"
            elif sma_5 < sma_10 * 0.999:  # -0.1% різниця
                trend = "DOWN"
            
            # Волатильність
            recent_closes = closes[-10:] if len(closes) >= 10 else closes
            volatility = (max(recent_closes) - min(recent_closes)) / min(recent_closes) * 100 if recent_closes and min(recent_closes) != 0 else 0
            
            # Сила тренду
            trend_strength = "СЛАБКИЙ"
            if trend != "NEUTRAL":
                trend_percentage = abs((sma_5 - sma_10) / sma_10 * 100)
                if trend_percentage > 0.3:
                    trend_strength = "СИЛЬНИЙ"
                elif trend_percentage > 0.1:
                    trend_strength = "ПОМІРНИЙ"
            
            return {
                "sma_5": sma_5,
                "sma_10": sma_10,
                "trend": trend,
                "trend_strength": trend_strength,
                "volatility": volatility,
                "current_price": closes[-1] if closes else 0,
                "price_change_5min": ((closes[-1] - closes[-5]) / closes[-5] * 100) if len(closes) >= 5 else 0
            }
            
        except Exception as e:
            logger.warning(f"⚠️ Помилка розрахунку технічних індикаторів: {e}")
            return {
                "sma_5": 0,
                "sma_10": 0,
                "trend": "NEUTRAL",
                "trend_strength": "НЕВІДОМИЙ",
                "volatility": 0,
                "current_price": 0,
                "price_change_5min": 0
            }
    
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
        
        # Групуємо за активом для кращого аналізу
        asset_feedback = {}
        for item in feedback[-10:]:  # Останні 10 записів
            asset = item.get('asset', 'Unknown')
            if asset not in asset_feedback:
                asset_feedback[asset] = {'success': 0, 'total': 0}
            
            asset_feedback[asset]['total'] += 1
            if item.get('success'):
                asset_feedback[asset]['success'] += 1
        
        formatted = []
        for asset, stats in asset_feedback.items():
            success_rate = (stats['success'] / stats['total'] * 100) if stats['total'] > 0 else 0
            formatted.append(f"- {asset}: {stats['success']}/{stats['total']} успішних ({success_rate:.1f}%)")
        
        if formatted:
            return "\n".join(formatted)
        
        # Альтернативний формат, якщо немає статистики по активу
        formatted = []
        for item in feedback[-5:]:
            result = "✅ УСПІШНО" if item.get('success') else "❌ НЕУСПІШНО"
            asset = item.get('asset', 'Unknown')
            direction = item.get('direction', 'N/A')
            reason = item.get('reason', '')[:100] + "..." if len(item.get('reason', '')) > 100 else item.get('reason', '')
            formatted.append(f"- {asset}: {direction} ({result}) - {reason}")
        
        return "\n".join(formatted)
