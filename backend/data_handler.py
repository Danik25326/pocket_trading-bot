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
        self.lessons_file = Config.LESSONS_FILE  # Додано цей рядок
        self.create_data_dir()
    
    def create_data_dir(self):
        """Створення директорій для даних"""
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Створюємо порожній lessons.json, якщо його немає
        if not os.path.exists(self.lessons_file):
            with open(self.lessons_file, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2, ensure_ascii=False)
    
    def save_signals(self, signals):
        """Збереження сигналів"""
        try:
            # Фільтруємо сигнали з достатньою впевненістю
            valid_signals = [
                s for s in signals 
                if s.get('confidence', 0) >= Config.MIN_CONFIDENCE
            ]
            
            if not valid_signals:
                print("⚠️ Немає сигналів з достатньою впевненістю для збереження")
                return False
            
            # Додаємо київський час
            now_kyiv = Config.get_kyiv_time()
            
            for signal in valid_signals:
                if 'generated_at' not in signal:
                    signal['generated_at'] = now_kyiv.isoformat()
                if 'timestamp' not in signal:
                    signal['timestamp'] = now_kyiv.strftime('%Y-%m-%d %H:%M:%S')
            
            # Читаємо існуючі сигнали
            existing_data = self.load_signals()
            existing_signals = existing_data.get('signals', [])
            
            # Фільтруємо тільки активні сигнали (не старіші ніж ACTIVE_SIGNAL_TIMEOUT хвилин)
            active_signals = []
            for signal in existing_signals:
                signal_time = datetime.fromisoformat(signal.get('generated_at', ''))
                if now_kyiv - signal_time <= timedelta(minutes=Config.ACTIVE_SIGNAL_TIMEOUT):
                    active_signals.append(signal)
            
            # Додаємо нові сигнали
            all_signals = active_signals + valid_signals
            
            # Обмежуємо кількість сигналів
            if len(all_signals) > Config.MAX_SIGNALS_HISTORY:
                all_signals = all_signals[-Config.MAX_SIGNALS_HISTORY:]
            
            # Оновлюємо дані
            data = {
                "last_update": now_kyiv.isoformat(),
                "signals": all_signals,
                "timezone": "Europe/Kiev (UTC+2)",
                "total_signals": len(all_signals),
                "active_signals": len([s for s in all_signals if self._is_signal_active(s)])
            }
            
            # Зберігаємо
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            # Додаємо в історію
            self._add_to_history(valid_signals)
            
            # Автоматичне очищення історії після 9 сигналів
            if len(all_signals) >= Config.CLEANUP_COUNT:
                self.cleanup_old_signals()
            
            print(f"💾 Збережено {len(valid_signals)} сигналів. Активних: {data['active_signals']}")
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
            return {"last_update": None, "signals": [], "timezone": "Europe/Kiev (UTC+2)"}
        except Exception as e:
            print(f"❌ Помилка завантаження сигналів: {e}")
            return {"last_update": None, "signals": [], "timezone": "Europe/Kiev (UTC+2)"}
    
    def _is_signal_active(self, signal):
        """Перевірка чи сигнал ще активний"""
        try:
            now_kyiv = Config.get_kyiv_time()
            
            # Час генерації сигналу
            generated_at = datetime.fromisoformat(signal.get('generated_at', ''))
            
            # Час входу
            entry_time_str = signal.get('entry_time', '')
            if ':' in entry_time_str:
                hour, minute = map(int, entry_time_str.split(':'))
                entry_date = generated_at.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                # Якщо час входу в минулому відносно часу генерації
                if entry_date < generated_at:
                    entry_date = entry_date.replace(day=entry_date.day + 1)
                
                # Тривалість угоди
                duration = int(signal.get('duration', 2))
                
                # Час закінчення угоди
                end_time = entry_date + timedelta(minutes=duration)
                
                # Сигнал активний, якщо поточний час між часом входу і закінченням
                return entry_date <= now_kyiv <= end_time
            
            return False
        except:
            return False
    
    def _add_to_history(self, signals):
        """Додавання сигналів до історії"""
        try:
            history = []
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            
            now_kyiv = Config.get_kyiv_time()
            for signal in signals:
                history_entry = signal.copy()
                history_entry['saved_at'] = now_kyiv.isoformat()
                history_entry['id'] = f"{signal['asset']}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                history.append(history_entry)
            
            # Обмежуємо історію
            if len(history) > Config.MAX_SIGNALS_HISTORY:
                history = history[-Config.MAX_SIGNALS_HISTORY:]
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False, default=str)
                
        except Exception as e:
            print(f"❌ Помилка додавання в історію: {e}")
    
    def save_feedback(self, signal_id, success, user_comment=""):
        """Збереження відгуку про результат угоди"""
        try:
            if not Config.FEEDBACK_ENABLED:
                return False
            
            feedback = []
            if os.path.exists(self.feedback_file):
                with open(self.feedback_file, 'r', encoding='utf-8') as f:
                    feedback = json.load(f)
            
            now_kyiv = Config.get_kyiv_time()
            feedback_entry = {
                'signal_id': signal_id,
                'success': success,
                'user_comment': user_comment,
                'feedback_at': now_kyiv.isoformat(),
                'learned': False
            }
            
            feedback.append(feedback_entry)
            
            with open(self.feedback_file, 'w', encoding='utf-8') as f:
                json.dump(feedback, f, indent=2, ensure_ascii=False, default=str)
            
            # Навчаємо ШІ на основі feedback
            self.learn_from_feedback()
            
            print(f"💾 Збережено відгук для сигналу {signal_id}: {'✅ Успіх' if success else '❌ Невдача'}")
            return True
            
        except Exception as e:
            print(f"❌ Помилка збереження відгуку: {e}")
            return False
    
    def get_feedback_history(self, asset=None):
        """Отримання історії відгуків"""
        try:
            if not os.path.exists(self.feedback_file):
                return []
            
            with open(self.feedback_file, 'r', encoding='utf-8') as f:
                feedback = json.load(f)
            
            if asset:
                # Фільтруємо по активу
                return [f for f in feedback if asset in f.get('signal_id', '')]
            
            return feedback
            
        except Exception as e:
            print(f"❌ Помилка отримання історії відгуків: {e}")
            return []
    
    def get_active_signals(self):
        """Отримання активних сигналів"""
        try:
            data = self.load_signals()
            signals = data.get('signals', [])
            
            active_signals = []
            for signal in signals:
                if self._is_signal_active(signal):
                    active_signals.append(signal)
            
            return active_signals
            
        except Exception as e:
            print(f"❌ Помилка отримання активних сигналів: {e}")
            return []
    
    def learn_from_feedback(self):
        """Навчання ШІ на основі feedback"""
        try:
            if not os.path.exists(self.feedback_file):
                return []
            
            with open(self.feedback_file, 'r', encoding='utf-8') as f:
                feedback = json.load(f)
            
            # Фільтруємо невивчені записи
            unlearned = [fb for fb in feedback if not fb.get('learned', False)]
            
            if not unlearned:
                return []
            
            lessons = []
            for fb in unlearned:
                lesson = {
                    'signal_id': fb.get('signal_id', ''),
                    'success': fb.get('success', False),
                    'feedback_at': fb.get('feedback_at', ''),
                    'learned_at': Config.get_kyiv_time().isoformat(),
                    'asset': fb.get('signal_id', '').split('_')[0] if '_' in fb.get('signal_id', '') else ''
                }
                lessons.append(lesson)
                
                # Позначаємо як вивчений
                fb['learned'] = True
            
            # Зберігаємо оновлений feedback
            with open(self.feedback_file, 'w', encoding='utf-8') as f:
                json.dump(feedback, f, indent=2, ensure_ascii=False, default=str)
            
            # Читаємо існуючі lessons
            existing_lessons = []
            if os.path.exists(self.lessons_file):
                with open(self.lessons_file, 'r', encoding='utf-8') as f:
                    existing_lessons = json.load(f)
            
            # Додаємо нові lessons
            all_lessons = existing_lessons + lessons
            
            # Зберігаємо lessons
            with open(self.lessons_file, 'w', encoding='utf-8') as f:
                json.dump(all_lessons, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"🧠 ШІ навчився на {len(lessons)} прикладах")
            return lessons
            
        except Exception as e:
            print(f"❌ Помилка навчання ШІ: {e}")
            return []
    
    def cleanup_old_signals(self):
        """Очищення старих сигналів (після кожних 9 сигналів)"""
        try:
            print("🧹 Очищення старих сигналів...")
            
            # Завантажуємо сигнали
            data = self.load_signals()
            signals = data.get('signals', [])
            
            if len(signals) <= 3:  # Залишаємо мінімум 3 сигнали
                return
            
            # Залишаємо тільки останні 3 сигнали
            keep_signals = signals[-3:]
            
            # Оновлюємо дані
            data['signals'] = keep_signals
            data['total_signals'] = len(keep_signals)
            data['active_signals'] = len([s for s in keep_signals if self._is_signal_active(s)])
            
            # Зберігаємо
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"✅ Залишено {len(keep_signals)} актуальних сигналів")
            
        except Exception as e:
            print(f"❌ Помилка очищення сигналів: {e}")
