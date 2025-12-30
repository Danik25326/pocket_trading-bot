import json
import os
from datetime import datetime, timedelta
from config import Config

class DataHandler:
    def __init__(self):
        self.data_dir = Config.DATA_DIR
        self.signals_file = Config.SIGNALS_FILE
        self.history_file = Config.HISTORY_FILE
        self.feedback_file = Config.FEEDBACK_FILE
        self.lessons_file = Config.LESSONS_FILE
        self.create_data_dir()
    
    def create_data_dir(self):
        """Створення директорій для даних"""
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Створюємо всі необхідні файли
        default_signals = {
            "last_update": None,
            "signals": [],
            "timezone": "Europe/Kiev (UTC+2)",
            "total_signals": 0,
            "active_signals": 0
        }
        
        if not os.path.exists(self.signals_file):
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(default_signals, f, indent=2, ensure_ascii=False)
        
        if not os.path.exists(self.history_file):
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2, ensure_ascii=False)
    
    def save_signals(self, signals):
        """Збереження сигналів - ПРОСТА ВЕРСІЯ"""
        try:
            if not signals:
                print("⚠️ Немає сигналів для збереження")
                return False
            
            # Проста фільтрація
            valid_signals = []
            for signal in signals:
                confidence = signal.get('confidence', 0)
                if confidence >= Config.MIN_CONFIDENCE:
                    # Додаємо ID, якщо немає
                    if 'id' not in signal:
                        now = datetime.now()
                        signal['id'] = f"{signal.get('asset', 'unknown')}_{now.strftime('%Y%m%d%H%M%S')}"
                    
                    # Додаємо час генерації
                    if 'generated_at' not in signal:
                        signal['generated_at'] = datetime.now().isoformat()
                    
                    valid_signals.append(signal)
            
            if not valid_signals:
                print("⚠️ Немає сигналів з достатньою впевненістю")
                return False
            
            # Створюємо нові дані (не змішуємо зі старими)
            now = datetime.now()
            data = {
                "last_update": now.isoformat(),
                "signals": valid_signals,
                "timezone": "Europe/Kiev (UTC+2)",
                "total_signals": len(valid_signals),
                "active_signals": len(valid_signals)  # Всі нові сигнали активні
            }
            
            # Зберігаємо
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            # Додаємо в історію
            self._add_to_history(valid_signals)
            
            print(f"✅ Збережено {len(valid_signals)} сигналів")
            return True
            
        except Exception as e:
            print(f"❌ Помилка збереження сигналів: {e}")
            import traceback
            print(f"Деталі: {traceback.format_exc()}")
            return False
    
    def load_signals(self):
        """Завантаження сигналів з файлу"""
        try:
            if os.path.exists(self.signals_file):
                with open(self.signals_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            
            # Повертаємо пусті дані
            return {
                "last_update": None,
                "signals": [],
                "timezone": "Europe/Kiev (UTC+2)",
                "total_signals": 0,
                "active_signals": 0
            }
            
        except Exception as e:
            print(f"❌ Помилка завантаження сигналів: {e}")
            return {
                "last_update": None,
                "signals": [],
                "timezone": "Europe/Kiev (UTC+2)",
                "total_signals": 0,
                "active_signals": 0
            }
    
    def _add_to_history(self, signals):
        """Додавання сигналів до історії"""
        try:
            if not signals:
                return
            
            history = []
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            
            now = datetime.now()
            for signal in signals:
                # Створюємо копію для історії
                history_signal = signal.copy()
                history_signal['history_saved_at'] = now.isoformat()
                history.append(history_signal)
            
            # Обмежуємо розмір історії
            if len(history) > 100:
                history = history[-100:]
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"📚 Додано {len(signals)} сигналів до історії")
            
        except Exception as e:
            print(f"❌ Помилка збереження в історію: {e}")
    
    def get_active_signals(self):
        """Отримання активних сигналів"""
        try:
            data = self.load_signals()
            signals = data.get('signals', [])
            
            # Проста перевірка: сигнал активний, якщо йому менше 5 хвилин
            current_time = datetime.now()
            active_signals = []
            
            for signal in signals:
                if 'generated_at' in signal:
                    try:
                        gen_time = datetime.fromisoformat(signal['generated_at'])
                        diff_minutes = (current_time - gen_time).total_seconds() / 60
                        
                        if diff_minutes <= 5:
                            active_signals.append(signal)
                    except:
                        active_signals.append(signal)
            
            return active_signals
            
        except Exception as e:
            print(f"❌ Помилка отримання активних сигналів: {e}")
            return []
