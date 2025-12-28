import os
import sys
import json
import re
import logging
from pathlib import Path
from dotenv import load_dotenv

# Додаємо шляхи для коректних імпортів
current_dir = Path(__file__).parent
project_root = current_dir.parent

sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "utils"))

load_dotenv()

logger = logging.getLogger("signal_bot")


class Config:
    # Корінь проекту
    BASE_DIR = project_root
    
    # Pocket Option
    POCKET_SSID = os.getenv('POCKET_SSID')
    POCKET_DEMO = os.getenv('POCKET_DEMO', 'true').lower() == 'true'
    
    # Groq AI - ОНОВЛЕНО НА МОДЕЛЬ ЯКА ПРАЦЮЄ
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')  # Твоя робоча модель!
    
    # Сигнали
    SIGNAL_INTERVAL = int(os.getenv('SIGNAL_INTERVAL', 300))
    MIN_CONFIDENCE = float(os.getenv('MIN_CONFIDENCE', 0.7))
    
    # Актив
    ASSETS_RAW = os.getenv('ASSETS', 'GBPJPY_otc,EURUSD_otc,USDJPY_otc')
    ASSETS = [asset.strip() for asset in ASSETS_RAW.split(',')]
    TIMEFRAMES = int(os.getenv('TIMEFRAMES', 120))
    
    # Логування
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # Шляхи до файлів
    DATA_DIR = BASE_DIR / 'data'
    SIGNALS_FILE = DATA_DIR / 'signals.json'
    HISTORY_FILE = DATA_DIR / 'history.json'
    ASSETS_CONFIG_FILE = DATA_DIR / 'assets_config.json'
    LOG_FILE = BASE_DIR / 'logs' / 'signals.log'
    
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
    
    @staticmethod
    def validate():
        """Перевірка конфігурації"""
        errors = []
        
        if not Config.POCKET_SSID:
            errors.append("❌ POCKET_SSID не встановлено")
        
        if not Config.GROQ_API_KEY:
            errors.append("❌ GROQ_API_KEY не встановлено")
        
        if not Config.ASSETS:
            errors.append("❌ Не вказано активи")
        
        if errors:
            for error in errors:
                logger.error(error)
            return False
        return True


# Перевірка при імпорті
if __name__ != "__main__":
    Config.validate()
