import os
import sys
import re
import logging
from pathlib import Path
from dotenv import load_dotenv

# Додаємо шляхи для коректних імпортів у GitHub Actions
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

logger = logging.getLogger("signal_bot")

class Config:
    # Корінь проекту
    BASE_DIR = Path(__file__).parent.parent
    
    # Pocket Option
    POCKET_SSID = os.getenv('POCKET_SSID')
    POCKET_DEMO = os.getenv('POCKET_DEMO', 'true').lower() == 'true'
    
    # Groq AI - ОНОВЛЕНА МОДЕЛЬ
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'meta-llama/llama-4-maverick-17b-128e-instruct')
    
    # Сигнали
    SIGNAL_INTERVAL = int(os.getenv('SIGNAL_INTERVAL', 300))
    MIN_CONFIDENCE = float(os.getenv('MIN_CONFIDENCE', 0.7))
    
    # Актив - ВИПРАВЛЕНО ФОРМАТ
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
    def validate():
        """Перевірка конфігурації"""
        errors = []
        
        if not Config.POCKET_SSID:
            errors.append("❌ POCKET_SSID не встановлено")
        
        if not Config.GROQ_API_KEY or Config.GROQ_API_KEY == 'your_groq_api_key_here':
            errors.append("❌ GROQ_API_KEY не встановлено")
        
        if not Config.ASSETS:
            errors.append("❌ Не вказано активи")
        
        return errors
