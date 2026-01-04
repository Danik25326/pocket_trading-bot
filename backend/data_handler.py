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
        self.usage_file = Config.USAGE_FILE
        self.kyiv_tz = pytz.timezone('Europe/Kiev')
        
        self.max_signals_to_show = Config.MAX_SIGNALS_TO_SHOW
        self.max_history_items = Config.MAX_HISTORY_ITEMS
        self.max_active_signals = Config.MAX_SIGNALS_TO_SHOW
        
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
                    "active_signals": 0,
                    "max_signals": self.max_active_signals
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
        
        if not os.path.exists(self.usage_file):
            with open(self.usage_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "date": datetime.now().strftime('%Y-%m-%d'),
                    "tokens_used": 0,
                    "requests_used": 0,
                    "last_reset": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    "daily_history": []
                }, f, indent=2, ensure_ascii=False)
    
    def save_signals(self, signals):
        """Збереження сигналів з обмеженнями"""
        try:
            if not signals:
                print("⚠️ Немає сигналів для збереження")
                return False
            
            # Завантажуємо існуючі сигнали
            existing_data = self.load_signals()
            existing_signals = existing_data.get('signals', [])
            
            # Завантажуємо фідбек, щоб знати, на які сигнали вже відповіли
            feedback = self.load_feedback()
            answered_signal_ids = {fb.get('signal_id') for fb in feedback if 'signal_id' in fb}
            
            # Фільтруємо існуючі сигнали: залишаємо тільки ті, на які ще не відповіли
            active_signals = []
            for signal in existing_signals:
                signal_id = signal.get('id')
                if not signal_id or signal_id not in answered_signal_ids:
                    # Також перевіряємо, чи сигнал ще активний
                    if self._is_signal_active(signal):
                        active_signals.append(signal)
            
            # Додаємо нові сигнали, якщо є місце
            for signal in signals:
                if len(active_signals) < self.max_active_signals:
                    # Переконуємося, що є всі необхідні поля
                    if 'id' not in signal:
                        now_kyiv = Config.get_kyiv_time()
                        signal['id'] = f"{signal['asset']}_{now_kyiv.strftime('%Y%m%d%H%M%S')}"
                    
                    active_signals.append(signal)
                else:
                    break
            
            # Обмежуємо загальну кількість
            if len(active_signals) > self.max_active_signals:
                active_signals = active_signals[-self.max_active_signals:]
            
            # Оновлюємо часові мітки
            now_kyiv = Config.get_kyiv_time()
            for signal in active_signals:
                if 'generated_at' not in signal:
                    signal['generated_at'] = now_kyiv.isoformat()
                if 'timestamp' not in signal:
                    signal['timestamp'] = now_kyiv.strftime('%Y-%m-%d %H:%M:%S')
            
            # Рахуємо активні сигнали
            active_count = 0
            for signal in active_signals:
                if self._is_signal_active(signal):
                    active_count += 1
            
            # Оновлюємо дані
            data = {
                "last_update": now_kyiv.isoformat(),
                "signals": active_signals,
                "timezone": "Europe/Kiev (UTC+2)",
                "total_signals": len(active_signals),
                "active_signals": active_count,
                "max_signals": self.max_active_signals,
                "language": Config.LANGUAGE
            }
            
            # Зберігаємо
            with open(self.signals_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            
            # Додаємо нові сигнали в історію
            self._add_to_history(signals)
            
            print(f"💾 Збережено {len(signals)} нових сигналів. Загалом: {len(active_signals)} (активних: {active_count})")
            return True
            
        except Exception as e:
            print(f"❌ Помилка збереження сигналів: {e}")
            import traceback
            print(f"Деталі: {traceback.format_exc()}")
            return False
    
    def load_feedback(self):
        """Завантаження фідбеку"""
        try:
            if os.path.exists(self.feedback_file):
                with open(self.feedback_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except:
            pass
        return []
    
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
                    if 'max_signals' not in data:
                        data['max_signals'] = self.max_active_signals
                    
                    return data
            return {
                "last_update": None,
                "signals": [],
                "timezone": "Europe/Kiev (UTC+2)",
                "total_signals": 0,
                "active_signals": 0,
                "max_signals": self.max_active_signals
            }
        except Exception as e:
            print(f"❌ Помилка завантаження сигналів: {e}")
            return {
                "last_update": None,
                "signals": [],
                "timezone": "Europe/Kiev (UTC+2)",
                "total_signals": 0,
                "active_signals": 0,
                "max_signals": self.max_active_signals
            }
    
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
    
    def _is_signal_active(self, signal):
        """Перевірка чи сигнал ще активний"""
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
            return entry_datetime <= now_kyiv <= end_time
            
        except Exception as e:
            print(f"⚠️ Помилка перевірки активності сигналу: {e}")
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
            
            # Обмежуємо історію
            if len(history) > self.max_history_items:
                history = history[-self.max_history_items:]
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False, default=str)
                
            print(f"📚 Додано {len(signals)} сигналів до історії (загалом: {len(history)})")
                
        except Exception as e:
            print(f"❌ Помилка додавання в історію: {e}")
    
    def save_feedback(self, signal_id, success, user_comment="", language='uk'):
        """Збереження відгуку про результат угоди"""
        try:
            if not Config.FEEDBACK_ENABLED:
                return False
            
            feedback = self.load_feedback()
            
            now_kyiv = Config.get_kyiv_time()
            feedback_entry = {
                'signal_id': signal_id,
                'success': success,
                'user_comment': user_comment,
                'feedback_at': now_kyiv.isoformat(),
                'learned': False,
                'language': language
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
    
    def learn_from_feedback(self):
        """Навчання ШІ на основі feedback"""
        try:
            feedback = self.load_feedback()
            
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
                    'asset': fb.get('signal_id', '').split('_')[0] if '_' in fb.get('signal_id', '') else '',
                    'language': fb.get('language', 'uk')
                }
                lessons.append(lesson)
                
                fb['learned'] = True
            
            # Зберігаємо оновлений фідбек
            with open(self.feedback_file, 'w', encoding='utf-8') as f:
                json.dump(feedback, f, indent=2, ensure_ascii=False, default=str)
            
            # Додаємо уроки
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
    
    def cleanup_old_signals(self):
        """Очищення старих сигналів"""
        try:
            print("🧹 Очищення старих сигналів...")
            
            data = self.load_signals()
            signals = data.get('signals', [])
            
            # Отримуємо фідбек, щоб знати, на які сигнали вже відповіли
            feedback = self.load_feedback()
            answered_signal_ids = {fb.get('signal_id') for fb in feedback if 'signal_id' in fb}
            
            # Фільтруємо сигнали
            valid_signals = []
            now_kyiv = Config.get_kyiv_time()
            
            for signal in signals:
                try:
                    # Видаляємо сигнали, на які вже відповіли
                    signal_id = signal.get('id')
                    if signal_id and signal_id in answered_signal_ids:
                        continue
                    
                    # Видаляємо старі неактивні сигнали
                    if not self._is_signal_active(signal):
                        gen_time_str = signal.get('generated_at')
                        if gen_time_str:
                            gen_time = self._parse_datetime(gen_time_str)
                            if gen_time and (now_kyiv - gen_time <= timedelta(minutes=Config.ACTIVE_SIGNAL_TIMEOUT)):
                                valid_signals.append(signal)
                    else:
                        valid_signals.append(signal)
                except:
                    continue
            
            # Обмежуємо кількість
            if len(valid_signals) > self.max_active_signals:
                valid_signals = valid_signals[-self.max_active_signals:]
            
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
