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
    # Pocket Option - ТІЛЬКИ РЕАЛЬНИЙ
    POCKET_SSID = os.getenv('POCKET_SSID')
    POCKET_DEMO = os.getenv('POCKET_DEMO', 'false').lower() == 'true'  # false для реального
    
    # Groq AI
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
    
    # Сигнали
    SIGNAL_INTERVAL = int(os.getenv('SIGNAL_INTERVAL', 600))
    MIN_CONFIDENCE = float(os.getenv('MIN_CONFIDENCE', 0.75))
    MAX_DURATION = float(os.getenv('MAX_DURATION', 5.0))
    MAX_SIGNALS_HISTORY = int(os.getenv('MAX_SIGNALS_HISTORY', 100))
    ACTIVE_SIGNAL_TIMEOUT = int(os.getenv('ACTIVE_SIGNAL_TIMEOUT', 10))
    MAX_SIGNALS_ON_SITE = int(os.getenv('MAX_SIGNALS_ON_SITE', 6))
    
    # Актив
    ASSETS_RAW = [asset.strip() for asset in os.getenv('ASSETS', 'GBPJPY_otc,EURUSD_otc,USDJPY_otc').split(',')]
    ASSETS = [asset.replace('/', '') for asset in ASSETS_RAW]
    
    TIMEFRAMES = int(os.getenv('TIMEFRAMES', 60))
    
    # Навчання
    FEEDBACK_ENABLED = os.getenv('FEEDBACK_ENABLED', 'true').lower() == 'true'
    CLEANUP_COUNT = 6
    
    # Шляхи до файлів
    DATA_DIR = BASE_DIR / 'data'
    SIGNALS_FILE = DATA_DIR / 'signals.json'
    HISTORY_FILE = DATA_DIR / 'history.json'
    FEEDBACK_FILE = DATA_DIR / 'feedback.json'
    ASSETS_CONFIG_FILE = DATA_DIR / 'assets_config.json'
    LESSONS_FILE = DATA_DIR / 'lessons.json'
    
    # Налаштування логування
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = BASE_DIR / 'logs' / 'signals.log'
    
    # Часовий пояс
    KYIV_TZ = pytz.timezone('Europe/Kiev')

    # Мова
    LANGUAGE = os.getenv('LANGUAGE', 'uk')

    @staticmethod
    def get_kyiv_time():
        return datetime.now(Config.KYIV_TZ)

    @staticmethod
    def validate_ssid_format(ssid):
        if not ssid:
            return False, "SSID порожній"
        
        pattern = r'^42\["auth",\{.*\}\]$'
        if not re.match(pattern, ssid):
            return False, f"Неправильний формат SSID"
        
        return True, "SSID валідний"
    
    @classmethod
    def get_validated_ssid(cls):
        """Повертає валідований SSID для РЕАЛЬНОГО рахунку"""
        ssid = cls.POCKET_SSID
        
        if not ssid:
            logger.error("❌ POCKET_SSID не знайдено! Перевірте .env або GitHub Secrets")
            return None
        
        # Детальна інформація про токен
        logger.info(f"🔍 Оригінальний SSID: {ssid[:100]}...")
        logger.info(f"🔍 Довжина: {len(ssid)} символів")
        logger.info(f"🔍 Режим: REAL (isDemo=0)")
        
        # Критично важливо: Якщо токен довгий (g.a000...), це неправильно для реального рахунку
        if ssid.startswith('g.a000'):
            logger.error("❌ НЕПРАВИЛЬНИЙ ТОКЕН ДЛЯ РЕАЛЬНОГО РАХУНКУ!")
            logger.error("ℹ️  Для реального рахунку потрібен КОРОТКИЙ токен (~32 символи)")
            logger.error("ℹ️  Отримай новий токен з реального рахунку (не демо!)")
            return None
        
        # Якщо SSID не у повному форматі, конвертуємо для РЕАЛЬНОГО рахунку
        if ssid and not ssid.startswith('42["auth"'):
            logger.info("⚙️ Конвертація для РЕАЛЬНОГО рахунку...")
            
            # ВАЖЛИВО: Для реального рахунку використовуємо session (не sessionToken!)
            # ВАЖЛИВО: isDemo=0 (не 1!)
            ssid = f'42["auth",{{"session":"{ssid}","isDemo":0,"uid":102582216,"platform":1,"isFastHistory":true}}]'
            
            logger.info(f"✅ Конвертовано для РЕАЛЬНОГО рахунку (isDemo=0)")
            logger.info(f"📋 Початок SSID: {ssid[:80]}...")
        
        is_valid, message = cls.validate_ssid_format(ssid)
        
        if is_valid:
            logger.info(f"✅ SSID валідний для РЕАЛЬНОГО рахунку ({len(ssid)} символів)")
            # Перевіряємо чи є isDemo:0
            if 'isDemo":0' in ssid:
                logger.info("🎯 isDemo:0 - правильно для реального рахунку")
            else:
                logger.error("❌ isDemo не дорівнює 0! Це не реальний рахунок!")
                return None
        else:
            logger.error(f"❌ Помилка валідації SSID: {message}")
            logger.error(f"SSID: {ssid[:100]}...")
        
        return ssid
    
    @classmethod
    def validate(cls):
        """Перевірка конфігурації для реального рахунку"""
        errors = []
        
        if not cls.POCKET_SSID:
            errors.append("❌ POCKET_SSID не встановлено")
        elif cls.POCKET_SSID.startswith('g.a000'):
            errors.append("❌ Використовується ДЕМО токен (g.a000...) для реального рахунку!")
            errors.append("❌ Отримай короткий токен з реального рахунку")
        
        if not cls.GROQ_API_KEY:
            errors.append("❌ GROQ_API_KEY не встановлено")
        
        if not cls.ASSETS:
            errors.append("❌ Не вказано активи")
        
        # Перевірка режиму
        if cls.POCKET_DEMO:
            errors.append("❌ POCKET_DEMO має бути false для реального рахунку")
        
        if errors:
            for error in errors:
                logger.error(error)
            return False
        
        logger.info("✅ Конфігурація валідна для РЕАЛЬНОГО рахунку")
        return True
