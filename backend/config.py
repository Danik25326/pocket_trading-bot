import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Отримуємо шлях до кореня проекту
BASE_DIR = Path(__file__).parent.parent

class Config:
    # Pocket Option
    POCKET_SSID = os.getenv('POCKET_SSID')
    POCKET_DEMO = os.getenv('POCKET_DEMO', 'true').lower() == 'true'
    
    # Groq AI
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama3-70b-8192')
    
    # Сигнали
    SIGNAL_INTERVAL = int(os.getenv('SIGNAL_INTERVAL', 300))
    MIN_CONFIDENCE = float(os.getenv('MIN_CONFIDENCE', 0.7))
    
    # Актив
    ASSETS = os.getenv('ASSETS', 'GBP/JPY_otc').split(',')
    TIMEFRAMES = int(os.getenv('TIMEFRAMES', 120))
    
    # Шляхи до файлів (відносно кореня проекту)
    DATA_DIR = BASE_DIR / 'data'
    SIGNALS_FILE = DATA_DIR / 'signals.json'
    HISTORY_FILE = DATA_DIR / 'history.json'
    ASSETS_CONFIG_FILE = DATA_DIR / 'assets_config.json'
    
    # Налаштування логування
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = BASE_DIR / 'logs' / 'signals.log'
