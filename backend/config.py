import os
import sys
import json
import re
import logging
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
import pytz

sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

logger = logging.getLogger("signal_bot")

BASE_DIR = Path(__file__).parent.parent

class Config:
    # Pocket Option
    POCKET_SSID = os.getenv('POCKET_SSID')
    POCKET_DEMO = os.getenv('POCKET_DEMO', 'true').lower() == 'true'
    
    # Groq AI
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
    
    # Сигнали
    SIGNAL_INTERVAL = int(os.getenv('SIGNAL_INTERVAL', 300))
    MIN_CONFIDENCE = float(os.getenv('MIN_CONFIDENCE', 0.7))
    MAX_DURATION = float(os.getenv('MAX_DURATION', 5.0))
    MAX_SIGNALS_HISTORY = int(os.getenv('MAX_SIGNALS_HISTORY', 100))
    ACTIVE_SIGNAL_TIMEOUT = int(os.getenv('ACTIVE_SIGNAL_TIMEOUT', 5))
    
    # Актив
    ASSETS_RAW = [asset.strip() for asset in os.getenv('ASSETS', 'GBPJPY_otc,EURUSD_otc,USDJPY_otc').split(',')]
    ASSETS = [asset.replace('/', '') for asset in ASSETS_RAW]
    
    TIMEFRAMES = int(os.getenv('TIMEFRAMES', 120))
    
    # Навчання
    FEEDBACK_ENABLED = os.getenv('FEEDBACK_ENABLED', 'true').lower() == 'true'
    CLEANUP_COUNT = int(os.getenv('SIGNAL_CLEANUP_COUNT', 9))
    
    # Ліміти відображення
    MAX_SIGNALS_TO_SHOW = int(os.getenv('MAX_SIGNALS_TO_SHOW', 6))
    MAX_HISTORY_ITEMS = int(os.getenv('MAX_HISTORY_ITEMS', 100))
    ENTRY_DELAY_MINUTES = int(os.getenv('ENTRY_DELAY_MINUTES', 2))
    
    # Ліміти API Groq
    MAX_TOKENS_PER_DAY = int(os.getenv('MAX_TOKENS_PER_DAY', 200000))
    MAX_REQUESTS_PER_DAY = int(os.getenv('MAX_REQUESTS_PER_DAY', 1000))
    MAX_REQUESTS_PER_MINUTE = int(os.getenv('MAX_REQUESTS_PER_MINUTE', 30))
    
    # Налаштування генерації
    ASSETS_PER_GENERATION = int(os.getenv('ASSETS_PER_GENERATION', 2))
    MIN_TIME_BETWEEN_REQUESTS = float(os.getenv('MIN_TIME_BETWEEN_REQUESTS', 1.0))
    
    # Шляхи до файлів
    DATA_DIR = BASE_DIR / 'data'
    SIGNALS_FILE = DATA_DIR / 'signals.json'
    HISTORY_FILE = DATA_DIR / 'history.json'
    FEEDBACK_FILE = DATA_DIR / 'feedback.json'
    ASSETS_CONFIG_FILE = DATA_DIR / 'assets_config.json'
    LESSONS_FILE = DATA_DIR / 'lessons.json'
    USAGE_FILE = DATA_DIR / 'usage.json'
    
    # Налаштування логування
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = BASE_DIR / 'logs' / 'signals.log'
    
    # Часовий пояс
    KYIV_TZ = pytz.timezone('Europe/Kiev')

    # Мова
    LANGUAGE = os.getenv('LANGUAGE', 'uk')

    @staticmethod
    def get_kyiv_time():
        """Отримання поточного часу в Києві"""
        return datetime.now(Config.KYIV_TZ)

    @staticmethod
    def validate_ssid_format(ssid):
        """Перевіряє чи SSID у правильному форматі"""
        if not ssid:
            return False, "SSID порожній"
        
        pattern = r'^42\["auth",\{.*\}\]$'
        if not re.match(pattern, ssid):
            return False, f"Неправильний формат SSID"
        
        return True, "SSID валідний"
    
    @classmethod
    def get_validated_ssid(cls):
        """Повертає валідований SSID"""
        ssid = cls.POCKET_SSID
        
        if not ssid:
            logger.error("SSID не знайдено! Перевірте .env або GitHub Secrets")
            return None
        
        if ssid and not ssid.startswith('42["auth"'):
            logger.warning(f"SSID не у повному форматі, конвертую...")
            logger.info(f"Оригінальний SSID: {ssid[:50]}...")
            
            ssid = f'42["auth",{{"session":"{ssid}","isDemo":1,"uid":12345,"platform":1}}]'
            logger.info(f"Конвертований SSID: {ssid[:50]}...")
        
        is_valid, message = cls.validate_ssid_format(ssid)
        
        if is_valid:
            logger.info(f"✅ SSID валідний ({len(ssid)} символів)")
        else:
            logger.error(f"❌ Помилка валідації SSID: {message}")
            logger.error(f"SSID: {ssid[:100]}...")
        
        return ssid
    
    @classmethod
    def validate(cls):
        """Перевірка конфігурації"""
        errors = []
        
        if not cls.POCKET_SSID:
            errors.append("❌ POCKET_SSID не встановлено")
        
        if not cls.GROQ_API_KEY:
            errors.append("❌ GROQ_API_KEY не встановлено")
        
        if not cls.ASSETS:
            errors.append("❌ Не вказано активи")
        
        if errors:
            for error in errors:
                logger.error(error)
            return False
        return True
    
    @classmethod
    def get_assets_for_generation(cls):
        """Отримати список активів для поточної генерації"""
        # Обмежуємо кількість активів для економії токенів
        return cls.ASSETS[:cls.ASSETS_PER_GENERATION]
