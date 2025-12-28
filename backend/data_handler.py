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
        self.create_data_dir()
    
    def create_data_dir(self):
        """Створення директорій для даних"""
        os.makedirs(self.data_dir, exist_ok=True)
    
    def load_signals(self):
        """Завантаження сигналів з файлу"""
        try:
            if os.path.exists(self.signals_file):
                with open(self.signals_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {"last_update": None, "signals": []}
        except Exception as e:
            print(f"❌ Помилка завантаження сигналів: {e}")
            return {"last_update": None, "signals": []}
    
    def save_signals(self, signals):
        """Збереження сигналів та оновлення історії"""
        try:
            # Отримуємо поточні сигнали
            current_data = self.load_signals()
            
            # Фільтруємо сигнали з достатньою впевненістю
            valid_signals = [
                s for s in signals 
                if s.get('confidence', 0) >= Config.MIN_CONFIDENCE
            ]
            
            if not valid_signals:
                print("⚠️ Немає сигналів з достатньою впевненістю для збереження")
                return False
            
            # Додаємо час генерації
            kyiv_tz = pytz.timezone('Europe/Kiev')
            for signal in valid_signals:
                if 'generated_at' not in signal:
                    signal['generated_at'] = datetime.now(kyiv_tz).isoformat()
            
            # Оновлюємо дані
            data = {
                "last_update": datetime.now(kyiv_tz).isoformat(),
                "signals": valid_signals
            }
            
            # Зберігаємо
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"💾 Збережено {len(valid_signals)} сигналів")
            
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
            
            kyiv_tz = pytz.timezone('Europe/Kiev')
            for signal in signals:
                history_entry = signal.copy()
                history_entry['saved_at'] = datetime.now(kyiv_tz).isoformat()
                history.append(history_entry)
            
            # Обмежуємо історію 1000 записами
            if len(history) > 1000:
                history = history[-1000:]
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False, default=str)
                
        except Exception as e:
            print(f"❌ Помилка додавання в історію: {e}")
    
    def _clean_old_signals(self, hours=1):
        """Очищення застарілих сигналів"""
        try:
            data = self.load_signals()
            if not data.get("signals"):
                return
            
            kyiv_tz = pytz.timezone('Europe/Kiev')
            current_time = datetime.now(kyiv_tz)
            
            filtered_signals = []
            for signal in data["signals"]:
                signal_time_str = signal.get("generated_at")
                if not signal_time_str:
                    continue
                
                try:
                    signal_time = datetime.fromisoformat(signal_time_str)
                    if signal_time.tzinfo is None:
                        signal_time = kyiv_tz.localize(signal_time)
                    
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
        """Отримання активних сигналів (не старіші за max_minutes_old)"""
        try:
            data = self.load_signals()
            signals = data.get("signals", [])
            
            if not signals:
                return []
            
            kyiv_tz = pytz.timezone('Europe/Kiev')
            current_time = datetime.now(kyiv_tz)
            
            active_signals = []
            for signal in signals:
                entry_time_str = signal.get("entry_time")
                if not entry_time_str:
                    continue
                
                try:
                    # Парсимо час входу (HH:MM)
                    entry_time = datetime.strptime(entry_time_str, "%H:%M").time()
                    today = current_time.date()
                    entry_datetime = kyiv_tz.localize(datetime.combine(today, entry_time))
                    
                    # Розраховуємо різницю
                    time_diff = current_time - entry_datetime
                    
                    # Сигнал активний, якщо час входу в майбутньому або не старіший за max_minutes_old
                    if time_diff < timedelta(minutes=0):
                        # Сигнал в майбутньому
                        active_signals.append(signal)
                    elif timedelta(minutes=0) <= time_diff <= timedelta(minutes=max_minutes_old):
                        # Сигнал не старіший за max_minutes_old
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
                return {"total_signals": 0, "success_rate": 0}
            
            with open(self.history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            
            if not history:
                return {"total_signals": 0, "success_rate": 0}
            
            total = len(history)
            successful = sum(1 for s in history if s.get("actual_result") == "win")
            
            return {
                "total_signals": total,
                "successful_signals": successful,
                "success_rate": successful / total if total > 0 else 0,
                "last_24h": len([s for s in history if self._is_recent(s.get("saved_at"), hours=24)])
            }
            
        except Exception as e:
            print(f"❌ Помилка отримання статистики: {e}")
            return {"total_signals": 0, "success_rate": 0}
    
    def _is_recent(self, timestamp, hours=24):
        """Перевірка чи timestamp не старіший за hours годин"""
        try:
            if not timestamp:
                return False
            signal_time = datetime.fromisoformat(timestamp)
            return (datetime.now() - signal_time).total_seconds() <= hours * 3600
        except Exception:
            return False
