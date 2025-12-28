import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Додаємо шляхи для імпортів
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

logger = logging.getLogger("signal_bot")
BASE_DIR = Path(__file__).parent.parent

class Config:
    # Pocket Option
    POCKET_SSID = os.getenv('POCKET_SSID')
    POCKET_DEMO = os.getenv('POCKET_DEMO', 'true').lower() == 'true'
    POCKET_UID = int(os.getenv('POCKET_UID', '102582216'))
    
    # Groq AI
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = 'llama-3.3-70b-versatile'  # Найкраща модель з вашого списку
    
    # Сигнали
    SIGNAL_INTERVAL = 300  # 5 хвилин
    MIN_CONFIDENCE = 0.7  # 70%
    MAX_ACTIVE_SIGNALS = 3
    SIGNAL_LIFETIME_MINUTES = 10
    
    # Актив
    ASSETS = ['GBPJPY_otc', 'EURUSD_otc', 'USDJPY_otc']
    TIMEFRAMES = 120  # 2 хвилини
    
    # Шляхи до файлів
    DATA_DIR = BASE_DIR / 'data'
    SIGNALS_FILE = DATA_DIR / 'signals.json'
    HISTORY_FILE = DATA_DIR / 'history.json'
    
    # Часовий пояс
    TIMEZONE = 'Europe/Kiev'
    
    @classmethod
    def validate_config(cls):
        """Перевірка конфігурації"""
        errors = []
        
        if not cls.POCKET_SSID:
            errors.append("❌ POCKET_SSID не знайдено")
        if not cls.GROQ_API_KEY or cls.GROQ_API_KEY == 'your_groq_api_key_here':
            errors.append("❌ GROQ_API_KEY не налаштовано")
        
        if errors:
            for error in errors:
                logger.error(error)
            return False
        
        logger.info("✅ Конфігурація валідна")
        return True
    
    @classmethod
    def get_formatted_ssid(cls):
        """Форматування SSID"""
        if not cls.POCKET_SSID:
            return None
        
        ssid = cls.POCKET_SSID
        if not ssid.startswith('42["auth"'):
            # Конвертація у повний формат
            ssid = f'42["auth",{{"session":"{ssid}","isDemo":1,"uid":{cls.POCKET_UID},"platform":1}}]'
        
        return ssid
