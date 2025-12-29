import os
import sys
import json
import re
import logging
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
import pytz

# Додаємо шлях до кореня проекту для імпортів
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

# Ініціалізація логера
logger = logging.getLogger("signal_bot")

# Корінь проекту
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
    # Конвертуємо формат з слешами на формат без слешів
    ASSETS_RAW = [asset.strip() for asset in os.getenv('ASSETS', 'GBPJPY_otc,EURUSD_otc,USDJPY_otc').split(',')]
    ASSETS = [asset.replace('/', '') for asset in ASSETS_RAW]  # Видаляємо слеші
    
    TIMEFRAMES = int(os.getenv('TIMEFRAMES', 120))
    
    # Навчання
    FEEDBACK_ENABLED = os.getenv('FEEDBACK_ENABLED', 'true').lower() == 'true'
    CLEANUP_COUNT = 9  # Очищення після 9 сигналів
    
    # Шляхи до файлів
    DATA_DIR = BASE_DIR / 'data'
    SIGNALS_FILE = DATA_DIR / 'signals.json'
    HISTORY_FILE = DATA_DIR / 'history.json'
    FEEDBACK_FILE = DATA_DIR / 'feedback.json'
    ASSETS_CONFIG_FILE = DATA_DIR / 'assets_config.json'
    LESSONS_FILE = DATA_DIR / 'lessons.json'  # Додано цей рядок!
    
    # Налаштування логування
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = BASE_DIR / 'logs' / 'signals.log'
    
    # Часовий пояс
    KYIV_TZ = pytz.timezone('Europe/Kiev')

    @staticmethod
    def get_kyiv_time():
        """Отримання поточного часу в Києві"""
        return datetime.now(Config.KYIV_TZ)

    @staticmethod
    def validate_ssid_format(ssid):
        """Перевіряє чи SSID у правильному форматі"""
        if not ssid:
            return False, "SSID порожній"
        
        # Перевірка формату
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
        
        # Якщо SSID не у повному форматі, конвертуємо
        if ssid and not ssid.startswith('42["auth"'):
            logger.warning(f"SSID не у повному форматі, конвертую...")
            logger.info(f"Оригінальний SSID: {ssid[:50]}...")
            
            # Конвертуємо у повний формат
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
