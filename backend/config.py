import os
from dotenv import load_dotenv

load_dotenv()

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
    
    # Шляхи до файлів
    DATA_DIR = 'data'
    SIGNALS_FILE = os.path.join(DATA_DIR, 'signals.json')
    HISTORY_FILE = os.path.join(DATA_DIR, 'history.json')
    ASSETS_CONFIG_FILE = os.path.join(DATA_DIR, 'assets_config.json')
    
    # Налаштування логування
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = 'logs/signals.log'
