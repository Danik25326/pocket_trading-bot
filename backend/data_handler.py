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
        self.feedback_file = Config.FEEDBACK_FILE
        self.lessons_file = Config.LESSONS_FILE
        self.kyiv_tz = pytz.timezone('Europe/Kiev')
        self.create_data_dir()
    
    def create_data_dir(self):
        """Створення директорій для даних"""
        os.makedirs(self.data_dir, exist_ok=True)
        
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
            
            now_kyiv = Config.get_kyiv_time()
            now_utc = datetime.utcnow()
            
            # Додаємо часові мітки
            for signal in valid_signals:
                if 'generated_at' not in signal:
                    signal['generated_at'] = now_kyiv.isoformat()
                if 'generated_at_utc' not in signal:
                    signal['generated_at_utc'] = now_utc.isoformat() + 'Z'
                if 'timestamp' not in signal:
                    signal['timestamp'] = now_kyiv.strftime('%Y-%m-%d %H:%M:%S')
                
                # Переконуємося, що є entry_timestamp
                if 'entry_timestamp' not in signal and 'entry_time' in signal:
                    try:
                        entry_time = signal['entry_time']
                        if ':' in entry_time:
                            hour, minute = map(int, entry_time.split(':'))
                            entry_date = now_kyiv.replace(hour=hour, minute=minute, second=0, microsecond=0)
                            
                            if entry_date < now_kyiv:
                                entry_date = entry_date + timedelta(days=1)
                            
                            signal['entry_timestamp'] = entry_date.isoformat()
                    except:
                        pass
            
            # Завантажуємо існуючі сигнали
            existing_data = self.load_signals()
            existing_signals = existing_data.get('signals', [])
            
            # Фільтруємо тільки активні сигнали (не старіші ніж ACTIVE_SIGNAL_TIMEOUT хвилин)
            active_signals = []
            for signal in existing_signals:
                signal_time_str = signal.get('generated_at_utc') or signal.get('generated_at')
                if signal_time_str:
                    try:
                        signal_time = datetime.fromisoformat(signal_time_str.replace('Z', '+00:00'))
                        signal_time_kyiv = pytz.UTC.localize(signal_time).astimezone(self.kyiv_tz)
                        
                        if now_kyiv - signal_time_kyiv <= timedelta(minutes=Config.ACTIVE_SIGNAL_TIMEOUT):
                            active_signals.append(signal)
                    except:
                        continue
            
            # Додаємо нові сигнали
            all_signals = active_signals + valid_signals
            
            # Обмежуємо кількість сигналів
            if len(all_signals) > Config.MAX_SIGNALS_HISTORY:
                all_signals = all_signals[-Config.MAX_SIGNALS_HISTORY:]
            
            # Оновлюємо дані
            data = {
                "last_update": now_kyiv.isoformat(),
                "last_update_utc": now_utc.isoformat() + 'Z',
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
            
            # Автоматичне очищення після 9 сигналів
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
            gen_time_str = signal.get('generated_at_utc') or signal.get('generated_at')
            if not gen_time_str:
                return False
            
            generated_at = datetime.fromisoformat(gen_time_str.replace('Z', '+00:00'))
            generated_at_kyiv = pytz.UTC.localize(generated_at).astimezone(self.kyiv_tz)
            
            # Час входу
            entry_timestamp = signal.get('entry_timestamp')
            if entry_timestamp:
                try:
                    entry_time = datetime.fromisoformat(entry_timestamp.replace('Z', '+00:00'))
                    entry_time_kyiv = pytz.UTC.localize(entry_time).astimezone(self.kyiv_tz)
                except:
                    # Якщо entry_timestamp не в форматі ISO, спробуємо через entry_time
                    entry_time_str = signal.get('entry_time', '')
                    if ':' in entry_time_str:
                        hour, minute = map(int, entry_time_str.split(':'))
                        entry_time_kyiv = generated_at_kyiv.replace(hour=hour, minute=minute, second=0, microsecond=0)
                        
                        if entry_time_kyiv < generated_at_kyiv:
                            entry_time_kyiv = entry_time_kyiv + timedelta(days=1)
                    else:
                        return False
            else:
                entry_time_str = signal.get('entry_time', '')
                if ':' in entry_time_str:
                    hour, minute = map(int, entry_time_str.split(':'))
                    entry_time_kyiv = generated_at_kyiv.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    
                    if entry_time_kyiv < generated_at_kyiv:
                        entry_time_kyiv = entry_time_kyiv + timedelta(days=1)
                else:
                    return False
            
            # Тривалість угоди
            duration = int(signal.get('duration', 2))
            
            # Час закінчення угоди
            end_time_kyiv = entry_time_kyiv + timedelta(minutes=duration)
            
            # Сигнал активний, якщо поточний час між часом входу і закінченням
            return entry_time_kyiv <= now_kyiv <= end_time_kyiv
            
        except Exception as e:
            print(f"⚠️ Помилка перевірки активності сигналу: {e}")
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
                history_entry['saved_at_utc'] = datetime.utcnow().isoformat() + 'Z'
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
                'feedback_at_utc': datetime.utcnow().isoformat() + 'Z',
                'learned': False
            }
            
            feedback.append(feedback_entry)
            
            with open(self.feedback_file, 'w', encoding='utf-8') as f:
                json.dump(feedback, f, indent=2, ensure_ascii=False, default=str)
            
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
                
                fb['learned'] = True
            
            with open(self.feedback_file, 'w', encoding='utf-8') as f:
                json.dump(feedback, f, indent=2, ensure_ascii=False, default=str)
            
            existing_lessons = []
            if os.path.exists(self.lessons_file):
                with open(self.lessons_file, 'r', encoding='utf-8') as f:
                    existing_lessons = json.load(f)
            
            all_lessons = existing_lessons + lessons
            
            with open(self.lessons_file, 'w', encoding='utf-8') as f:
                json.dump(all_lessons, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"🧠 ШІ навчився на {len(lessons)} прикладах")
            return lessons
            
        except Exception as e:
            print(f"❌ Помилка навчання ШІ: {e}")
            return []
    
    def cleanup_old_signals(self):
        """Очищення старих сигналів"""
        try:
            print("🧹 Очищення старих сигналів...")
            
            data = self.load_signals()
            signals = data.get('signals', [])
            
            if len(signals) <= 3:
                return
            
            now_kyiv = Config.get_kyiv_time()
            valid_signals = []
            
            for signal in signals:
                signal_time_str = signal.get('generated_at_utc') or signal.get('generated_at')
                if signal_time_str:
                    try:
                        signal_time = datetime.fromisoformat(signal_time_str.replace('Z', '+00:00'))
                        signal_time_kyiv = pytz.UTC.localize(signal_time).astimezone(self.kyiv_tz)
                        
                        if now_kyiv - signal_time_kyiv <= timedelta(minutes=Config.ACTIVE_SIGNAL_TIMEOUT):
                            valid_signals.append(signal)
                    except:
                        continue
            
            if len(valid_signals) > 3:
                valid_signals = valid_signals[-3:]
            
            data['signals'] = valid_signals
            data['total_signals'] = len(valid_signals)
            data['active_signals'] = len([s for s in valid_signals if self._is_signal_active(s)])
            
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"✅ Залишено {len(valid_signals)} актуальних сигналів")
            
        except Exception as e:
            print(f"❌ Помилка очищення сигналів: {e}")
