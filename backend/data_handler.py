import json
import os
from datetime import datetime, timedelta
from config import Config
from logger import logger

class DataHandler:
    def __init__(self):
        self.data_dir = Config.DATA_DIR
        self.signals_file = Config.SIGNALS_FILE
        self.history_file = Config.HISTORY_FILE
        self.create_data_dir()
    
    def create_data_dir(self):
        """Створює папку data, якщо її немає"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def load_signals(self):
        """Завантажує поточні сигнали"""
        try:
            if os.path.exists(self.signals_file):
                with open(self.signals_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {"last_update": None, "signals": []}
        except Exception as e:
            print(f"Error loading signals: {e}")
            return {"last_update": None, "signals": []}
    
    def save_signals(self, signals):
        """Зберігає нові сигнали"""
        data = {
            "last_update": datetime.now().isoformat(),
            "signals": signals
        }
        
        try:
            # Зберігаємо поточні сигнали
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Додаємо до історії
            self.add_to_history(signals)
            
            # Очищаємо застарілі сигнали (старіше 1 години)
            self.clean_old_signals()
            
            return True
        except Exception as e:
            print(f"Error saving signals: {e}")
            return False
    
    def add_to_history(self, signals):
        """Додає сигнали до історії"""
        try:
            history = []
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            
            # Додаємо нові сигнали з timestamp
            for signal in signals:
                signal_with_time = {
                    **signal,
                    "saved_at": datetime.now().isoformat()
                }
                history.append(signal_with_time)
            
            # Обмежуємо історію останніми 1000 записами
            if len(history) > 1000:
                history = history[-1000:]
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"Error adding to history: {e}")
    
    def clean_old_signals(self, hours=1):
        """Видаляє сигнали старіші за вказану кількість годин"""
        try:
            data = self.load_signals()
            if not data.get("signals"):
                return
            
            current_time = datetime.now()
            filtered_signals = []
            
            for signal in data["signals"]:
                signal_time = datetime.fromisoformat(signal.get("generated_at", signal.get("timestamp")))
                if current_time - signal_time <= timedelta(hours=hours):
                    filtered_signals.append(signal)
            
            data["signals"] = filtered_signals
            
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"Error cleaning old signals: {e}")
    
    def get_statistics(self):
        """Повертає статистику сигналів"""
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
                
                if not history:
                    return {"total": 0, "success_rate": 0}
                
                # Це приклад - тобі потрібно буде додати логіку відстеження реальних результатів
                total = len(history)
                successful = sum(1 for s in history if s.get("actual_result") == "win")
                
                return {
                    "total_signals": total,
                    "successful_signals": successful,
                    "success_rate": successful / total if total > 0 else 0,
                    "last_week_count": len([s for s in history if self.is_recent(s.get("saved_at"), days=7)])
                }
            return {"total": 0, "success_rate": 0}
        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {"total": 0, "success_rate": 0}
    
    def is_recent(self, timestamp, days=7):
        """Перевіряє, чи є timestamp не старіший за вказану кількість днів"""
        try:
            if not timestamp:
                return False
            signal_time = datetime.fromisoformat(timestamp)
            return (datetime.now() - signal_time).days <= days
        except:
            return False
