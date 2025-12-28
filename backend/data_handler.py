import json
import os
from datetime import datetime, timedelta
import pytz
from config import Config

class DataHandler:
    def __init__(self):
        self.data_dir = Config.DATA_DIR
        self.signals_file = Config.SIGNALS_FILE
        self.history_file = Config.HISTORY_FILE
        self.kyiv_tz = pytz.timezone('Europe/Kiev')
        self.create_data_dir()
    
    def create_data_dir(self):
        """Створення директорій для даних"""
        os.makedirs(self.data_dir, exist_ok=True)
    
    def get_current_kyiv_time(self):
        """Повертає поточний час в Києві"""
        return datetime.now(self.kyiv_tz)
    
    def load_signals(self):
        """Завантаження сигналів з файлу"""
        try:
            if os.path.exists(self.signals_file):
                with open(self.signals_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data
            return {"last_update": None, "signals": []}
        except Exception as e:
            print(f"❌ Помилка завантаження сигналів: {e}")
            return {"last_update": None, "signals": []}
    
    def save_signals(self, signals):
        """Збереження сигналів з Київським часом"""
        try:
            # Отримуємо поточний час в Києві
            current_time = self.get_current_kyiv_time()
            
            # Фільтруємо сигнали з достатньою впевненістю
            valid_signals = []
            for signal in signals:
                # Переконуємося, що в сигналі вказаний часовий пояс
                if 'timezone' not in signal:
                    signal['timezone'] = 'Europe/Kiev (UTC+2)'
                
                # Додаємо час збереження
                signal['saved_at_kyiv'] = current_time.isoformat()
                
                valid_signals.append(signal)
            
            if not valid_signals:
                print("⚠️ Немає сигналів для збереження")
                return False
            
            # Створюємо структуру даних
            data = {
                "last_update": current_time.isoformat(),
                "last_update_human": current_time.strftime('%Y-%m-%d %H:%M:%S'),
                "timezone": "Europe/Kiev (UTC+2)",
                "signals": valid_signals
            }
            
            # Зберігаємо
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"💾 Збережено {len(valid_signals)} сигналів ({current_time.strftime('%H:%M:%S')} Київ)")
            
            # Додаємо в історію
            self._add_to_history(valid_signals)
            
            # Очищаємо застарілі сигнали
            self._clean_old_signals(hours=1)
            
            return True
            
        except Exception as e:
            print(f"❌ Помилка збереження сигналів: {e}")
            return False
    
    def _add_to_history(self, signals):
        """Додавання сигналів до історії"""
        try:
            history = []
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            
            current_time = self.get_current_kyiv_time()
            
            for signal in signals:
                history_entry = signal.copy()
                history_entry['history_saved_at'] = current_time.isoformat()
                history.append(history_entry)
            
            # Обмежуємо історію 500 записами
            if len(history) > 500:
                history = history[-500:]
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False, default=str)
                
        except Exception as e:
            print(f"❌ Помилка додавання в історію: {e}")
    
    def _clean_old_signals(self, hours=1):
        """Очищення застарілих сигналів (старіші за hours годин)"""
        try:
            data = self.load_signals()
            if not data.get("signals"):
                return
            
            current_time = self.get_current_kyiv_time()
            
            filtered_signals = []
            for signal in data["signals"]:
                signal_time_str = signal.get("generated_at")
                if not signal_time_str:
                    continue
                
                try:
                    signal_time = datetime.fromisoformat(signal_time_str)
                    if signal_time.tzinfo is None:
                        signal_time = self.kyiv_tz.localize(signal_time)
                    
                    # Залишаємо сигнали не старіші ніж hours годин
                    if current_time - signal_time <= timedelta(hours=hours):
                        filtered_signals.append(signal)
                except Exception:
                    continue
            
            data["signals"] = filtered_signals
            
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
                
        except Exception as e:
            print(f"❌ Помилка очищення старих сигналів: {e}")
    
    def get_active_signals(self, max_minutes_old=10):
        """Отримання активних сигналів (не старіші за max_minutes_old хвилин)"""
        try:
            data = self.load_signals()
            signals = data.get("signals", [])
            
            if not signals:
                return []
            
            current_time = self.get_current_kyiv_time()
            
            active_signals = []
            for signal in signals:
                entry_time_str = signal.get("entry_time")
                if not entry_time_str:
                    continue
                
                try:
                    # Парсимо час входу (HH:MM)
                    entry_time = datetime.strptime(entry_time_str, "%H:%M").time()
                    today = current_time.date()
                    entry_datetime = self.kyiv_tz.localize(datetime.combine(today, entry_time))
                    
                    # Розраховуємо різницю
                    time_diff = current_time - entry_datetime
                    
                    # Сигнал активний, якщо час входу в майбутньому або не старіший за max_minutes_old
                    if time_diff < timedelta(minutes=0):
                        # Сигнал в майбутньому
                        signal['status'] = 'pending'
                        active_signals.append(signal)
                    elif timedelta(minutes=0) <= time_diff <= timedelta(minutes=max_minutes_old):
                        # Сигнал не старіший за max_minutes_old
                        signal['status'] = 'active'
                        active_signals.append(signal)
                        
                except Exception as e:
                    print(f"❌ Помилка парсингу часу {entry_time_str}: {e}")
                    continue
            
            return active_signals
            
        except Exception as e:
            print(f"❌ Помилка отримання активних сигналів: {e}")
            return []
    
    def get_statistics(self):
        """Статистика сигналів"""
        try:
            if not os.path.exists(self.history_file):
                return {
                    "total_signals": 0,
                    "success_rate": 0,
                    "last_update": None,
                    "timezone": "Europe/Kiev"
                }
            
            with open(self.history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            
            if not history:
                return {
                    "total_signals": 0,
                    "success_rate": 0,
                    "last_update": None,
                    "timezone": "Europe/Kiev"
                }
            
            total = len(history)
            successful = sum(1 for s in history if s.get("actual_result") == "win")
            
            return {
                "total_signals": total,
                "successful_signals": successful,
                "success_rate": successful / total if total > 0 else 0,
                "last_update": self.get_current_kyiv_time().strftime('%Y-%m-%d %H:%M:%S'),
                "timezone": "Europe/Kiev (UTC+2)",
                "last_24h": len([s for s in history if self._is_recent(s.get("history_saved_at"), hours=24)])
            }
            
        except Exception as e:
            print(f"❌ Помилка отримання статистики: {e}")
            return {
                "total_signals": 0,
                "success_rate": 0,
                "last_update": None,
                "timezone": "Europe/Kiev"
            }
    
    def _is_recent(self, timestamp, hours=24):
        """Перевірка чи timestamp не старіший за hours годин"""
        try:
            if not timestamp:
                return False
            signal_time = datetime.fromisoformat(timestamp)
            return (datetime.now() - signal_time).total_seconds() <= hours * 3600
        except Exception:
            return False
