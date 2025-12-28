import json
import logging
import os  # ДОДАВ ІМПОРТ OS
from groq import Groq
from datetime import datetime, timedelta
import pytz
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
            
            # ФІКС: Видаляємо змінні проксі
            proxy_vars = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']
            for var in proxy_vars:
                os.environ.pop(var, None)
            
            # ПРОСТА ІНІЦІАЛІЗАЦІЯ БЕЗ ЖОДНИХ ДОДАТКОВИХ ПАРАМЕТРІВ
            self.client = Groq(api_key=Config.GROQ_API_KEY)
            logger.info(f"✅ Groq AI ініціалізовано (модель: {Config.GROQ_MODEL})")
            
        except Exception as e:
            logger.error(f"❌ Помилка ініціалізації Groq: {e}")
            import traceback
            logger.error(f"Деталі: {traceback.format_exc()}")
    
    def analyze_market(self, asset, candles_data):
        """Аналіз ринку через Groq AI"""
        if not self.client:
            logger.error("❌ Groq AI не ініціалізовано")
            return None
        
        try:
            # Форматуємо свічки
            candles_str = self._format_candles(candles_data)
            
            # Поточний час Київ
            kyiv_tz = pytz.timezone('Europe/Kiev')
            now_kyiv = datetime.now(kyiv_tz)
            entry_time = (now_kyiv + timedelta(minutes=1)).strftime('%H:%M')
            
            prompt = f"""Актив: {asset}
Час: {now_kyiv.strftime('%H:%M')} (Київ)

Останні 15 свічок:
{candles_str}

Проаналізуй технічний аналіз та дай торговий сигнал бінарним опціоном.
Відповідь у форматі JSON:
{{
    "direction": "UP" або "DOWN",
    "confidence": число від 0.7 до 0.95,
    "entry_time": "{entry_time}",
    "duration": 2,
    "reason": "коротке обґрунтування",
    "asset": "{asset}"
}}"""
            
            logger.info(f"🧠 Аналізую {asset}...")
            
            completion = self.client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "Ти професійний трейдер. Давай точні торгові сигнали."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )
            
            response_text = completion.choices[0].message.content
            
            # Чистимо від markdown
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            
            response = json.loads(response_text)
            
            # Додаємо обов'язкові поля
            response['generated_at'] = now_kyiv.isoformat()
            response['timestamp'] = now_kyiv.strftime('%Y-%m-%d %H:%M:%S')
            
            # Перевіряємо впевненість
            if response.get('confidence', 0) < Config.MIN_CONFIDENCE:
                logger.warning(f"⚠️ Низька впевненість: {response.get('confidence', 0)*100:.1f}%")
                return None
            
            logger.info(f"✅ Сигнал: {response.get('direction')} ({response.get('confidence', 0)*100:.1f}%)")
            return response
            
        except Exception as e:
            logger.error(f"❌ Помилка AI для {asset}: {e}")
            return None
    
    def _format_candles(self, candles):
        """Спрощене форматування свічок"""
        if not candles:
            return "Немає даних"
        
        formatted = []
        # Беремо останні 15 свічок
        for i, candle in enumerate(candles[-15:]):
            try:
                # Спрощений парсинг
                if hasattr(candle, 'close'):
                    close = candle.close
                    open_price = candle.open
                elif isinstance(candle, dict):
                    close = candle.get('close', 0)
                    open_price = candle.get('open', 0)
                elif isinstance(candle, (list, tuple)) and len(candle) >= 5:
                    open_price = candle[1]
                    close = candle[4]
                else:
                    continue
                
                direction = "🟢" if close > open_price else "🔴"
                formatted.append(f"{i+1}. {direction} O:{float(open_price):.5f} C:{float(close):.5f}")
            except Exception:
                continue
        
        return "\n".join(formatted) if formatted else "Немає даних"
