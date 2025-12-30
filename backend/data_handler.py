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
        
        # Створюємо всі необхідні файли, якщо їх немає
        if not os.path.exists(self.signals_file):
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "last_update": None,
                    "signals": [],
                    "timezone": "Europe/Kiev (UTC+2)",
                    "total_signals": 0,
                    "active_signals": 0
                }, f, indent=2, ensure_ascii=False)
        
        if not os.path.exists(self.history_file):
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2, ensure_ascii=False)
                
        if not os.path.exists(self.feedback_file):
            with open(self.feedback_file, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2, ensure_ascii=False)
        
        if not os.path.exists(self.lessons_file):
            with open(self.lessons_file, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2, ensure_ascii=False)
    
    def save_signals(self, signals):
        """Збереження сигналів - СПРОЩЕНА ВЕРСІЯ"""
        try:
            if not signals:
                print("⚠️ Немає сигналів для збереження")
                return False
            
            # Фільтруємо сигнали з достатньою впевненістю
            valid_signals = []
            for signal in signals:
                confidence = signal.get('confidence', 0)
                if confidence >= Config.MIN_CONFIDENCE:
                    # Переконуємося, що є всі необхідні поля
                    if 'asset' not in signal or 'direction' not in signal:
                        continue
                    
                    # Додаємо ID, якщо немає
                    if 'id' not in signal:
                        now_kyiv = Config.get_kyiv_time()
                        signal['id'] = f"{signal['asset']}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                    
                    valid_signals.append(signal)
            
            if not valid_signals:
                print("⚠️ Немає сигналів з достатньою впевненістю для збереження")
                return False
            
            now_kyiv = Config.get_kyiv_time()
            
            # Оновлюємо часові мітки для кожного сигналу
            for signal in valid_signals:
                # Додаємо часові мітки, якщо їх немає
                if 'generated_at' not in signal:
                    signal['generated_at'] = now_kyiv.isoformat()
                
                if 'timestamp' not in signal:
                    signal['timestamp'] = now_kyiv.strftime('%Y-%m-%d %H:%M:%S')
                
                # Переконуємося, що є entry_time
                if 'entry_time' not in signal:
                    # Створюємо час входу через 2 хвилини
                    entry_time_dt = now_kyiv + timedelta(minutes=2)
                    signal['entry_time'] = entry_time_dt.strftime('%H:%M')
                
                # Переконуємося, що є duration
                if 'duration' not in signal:
                    signal['duration'] = 2  # Типове значення
            
            # Завантажуємо існуючі сигнали
            existing_data = self.load_signals()
            existing_signals = existing_data.get('signals', [])
            
            # Фільтруємо старі сигнали (старіші 5 хвилин)
            current_signals = []
            for signal in existing_signals:
                try:
                    gen_time_str = signal.get('generated_at')
                    if gen_time_str:
                        gen_time = self._parse_datetime(gen_time_str)
                        if now_kyiv - gen_time <= timedelta(minutes=Config.ACTIVE_SIGNAL_TIMEOUT):
                            current_signals.append(signal)
                except:
                    continue
            
            # Додаємо нові сигнали
            all_signals = current_signals + valid_signals
            
            # Обмежуємо кількість (максимум 5 сигналів)
            if len(all_signals) > 5:
                all_signals = all_signals[-5:]
            
            # Рахуємо активні сигнали
            active_count = 0
            for signal in all_signals:
                if self._is_signal_active(signal):
                    active_count += 1
            
            # Оновлюємо дані
            data = {
                "last_update": now_kyiv.isoformat(),
                "signals": all_signals,
                "timezone": "Europe/Kiev (UTC+2)",
                "total_signals": len(all_signals),
                "active_signals": active_count
            }
            
            # Зберігаємо
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            # Додаємо в історію
            self._add_to_history(valid_signals)
            
            print(f"💾 Збережено {len(valid_signals)} сигналів. Активних: {active_count}")
            return True
            
        except Exception as e:
            print(f"❌ Помилка збереження сигналів: {e}")
            import traceback
            print(f"Деталі: {traceback.format_exc()}")
            return False
    
    def _parse_datetime(self, datetime_str):
        """Парсинг datetime з рядка з обробкою різних форматів"""
        if not datetime_str:
            return None
        
        try:
            # Спроба парсингу ISO формату
            if 'Z' in datetime_str:
                dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
            else:
                dt = datetime.fromisoformat(datetime_str)
            
            # Якщо немає часового поясу, додаємо UTC
            if dt.tzinfo is None:
                dt = pytz.UTC.localize(dt)
            
            # Конвертуємо в Київський час
            return dt.astimezone(self.kyiv_tz)
            
        except Exception as e:
            print(f"⚠️ Помилка парсингу часу '{datetime_str}': {e}")
            return None
    
    def load_signals(self):
        """Завантаження сигналів з файлу"""
        try:
            if os.path.exists(self.signals_file):
                with open(self.signals_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Переконуємося, що є всі обов'язкові поля
                    if 'signals' not in data:
                        data['signals'] = []
                    if 'total_signals' not in data:
                        data['total_signals'] = len(data.get('signals', []))
                    if 'active_signals' not in data:
                        data['active_signals'] = len([s for s in data.get('signals', []) if self._is_signal_active(s)])
                    
                    return data
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
    
    def _is_signal_active(self, signal):
        """Перевірка чи сигнал ще активний - СПРОЩЕНА ВЕРСІЯ"""
        try:
            now_kyiv = Config.get_kyiv_time()
            
            # Час генерації сигналу
            gen_time_str = signal.get('generated_at')
            if not gen_time_str:
                return False
            
            generated_at = self._parse_datetime(gen_time_str)
            if not generated_at:
                return False
            
            # Час входу
            entry_time_str = signal.get('entry_time', '')
            if not entry_time_str or ':' not in entry_time_str:
                return False
            
            # Парсимо час входу
            hour, minute = map(int, entry_time_str.split(':'))
            
            # Створюємо час входу на основі часу генерації
            entry_datetime = generated_at.replace(
                hour=hour, 
                minute=minute, 
                second=0, 
                microsecond=0
            )
            
            # Якщо час входу вже минув відносно генерації, додаємо 1 день
            if entry_datetime < generated_at:
                entry_datetime = entry_datetime + timedelta(days=1)
            
            # Тривалість угоди
            duration = int(signal.get('duration', 2))
            
            # Час закінчення
            end_time = entry_datetime + timedelta(minutes=duration)
            
            # Сигнал активний, якщо зараз між входом і закінченням
            is_active = entry_datetime <= now_kyiv <= end_time
            
            # Додаємо відлагоджувальну інформацію
            if is_active:
                time_left = (end_time - now_kyiv).total_seconds() / 60
                print(f"   ✅ Сигнал {signal.get('asset')} активний. Залишилось: {time_left:.1f} хв")
            
            return is_active
            
        except Exception as e:
            print(f"⚠️ Помилка перевірки активності сигналу: {e}")
            import traceback
            print(f"   Сигнал: {signal.get('asset', 'N/A')}")
            print(f"   Деталі: {traceback.format_exc()}")
            return False
    
    def _add_to_history(self, signals):
        """Додавання сигналів до історії"""
        try:
            if not signals:
                return
            
            history = []
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            
            now_kyiv = Config.get_kyiv_time()
            for signal in signals:
                # Створюємо копію сигналу для історії
                history_entry = signal.copy()
                history_entry['saved_at'] = now_kyiv.isoformat()
                history_entry['history_id'] = f"{signal.get('asset', 'unknown')}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                history.append(history_entry)
            
            # Обмежуємо історію (останні 100 записів)
            if len(history) > Config.MAX_SIGNALS_HISTORY:
                history = history[-Config.MAX_SIGNALS_HISTORY:]
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False, default=str)
                
            print(f"📚 Додано {len(signals)} сигналів до історії")
                
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
        """Очищення старих сигналів - СПРОЩЕНА ВЕРСІЯ"""
        try:
            print("🧹 Очищення старих сигналів...")
            
            data = self.load_signals()
            signals = data.get('signals', [])
            
            if len(signals) <= 3:
                return
            
            now_kyiv = Config.get_kyiv_time()
            valid_signals = []
            
            for signal in signals:
                try:
                    gen_time_str = signal.get('generated_at')
                    if gen_time_str:
                        gen_time = self._parse_datetime(gen_time_str)
                        if gen_time and (now_kyiv - gen_time <= timedelta(minutes=Config.ACTIVE_SIGNAL_TIMEOUT)):
                            valid_signals.append(signal)
                except:
                    continue
            
            # Залишаємо максимум 3 останні сигнали
            if len(valid_signals) > 3:
                valid_signals = valid_signals[-3:]
            
            # Рахуємо активні
            active_count = 0
            for signal in valid_signals:
                if self._is_signal_active(signal):
                    active_count += 1
            
            # Оновлюємо дані
            data['signals'] = valid_signals
            data['total_signals'] = len(valid_signals)
            data['active_signals'] = active_count
            
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"✅ Залишено {len(valid_signals)} актуальних сигналів (активних: {active_count})")
            
        except Exception as e:
            print(f"❌ Помилка очищення сигналів: {e}")
