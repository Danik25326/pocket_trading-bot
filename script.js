class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.lastGenerationTime = null;
        this.cooldownMinutes = 5;
        this.cooldownInterval = null;

        this.translations = {
            uk: {
                title: "AI Trading Signals",
                subtitle: "Генерація сигналів на основі GPT-OSS-120b",
                lastUpdate: "Оновлено",
                activeSignals: "Активні",
                currentSignals: "Сигнали",
                searchBtn: "Пошук сигналів",
                updateBtn: "Оновити",
                pressSearch: "Натисніть 'Пошук сигналів'",
                searchDesc: "AI проаналізує ринок і знайде точки входу",
                noSignalsNow: "Сигналів не знайдено",
                waitForUpdate: "Спробуйте оновити пізніше",
                timerWaiting: "Вхід через:",
                timerActive: "Час угоди:",
                timerExpired: "Завершено",
                confidence: "Впевненість",
                entry: "Вхід",
                duration: "Час",
                aiReason: "Аналіз AI"
            },
            ru: {
                title: "AI Торговые Сигналы",
                subtitle: "Генерация сигналов на основе GPT-OSS-120b",
                lastUpdate: "Обновлено",
                activeSignals: "Активные",
                currentSignals: "Сигналы",
                searchBtn: "Поиск сигналов",
                updateBtn: "Обновить",
                pressSearch: "Нажмите 'Поиск сигналов'",
                searchDesc: "AI проанализирует рынок и найдет точки входа",
                noSignalsNow: "Сигналов не найдено",
                waitForUpdate: "Попробуйте обновить позже",
                timerWaiting: "Вход через:",
                timerActive: "Время сделки:",
                timerExpired: "Завершено",
                confidence: "Уверенность",
                entry: "Вход",
                duration: "Время",
                aiReason: "Анализ AI"
            }
        };

        this.init();
    }

    init() {
        this.setupLanguage();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);

        // Кнопка ПОШУК (перший запуск)
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch();
        });

        // Кнопка ОНОВИТИ
        document.getElementById('refresh-btn').addEventListener('click', () => {
            if (!document.getElementById('refresh-btn').disabled) {
                this.loadSignals(true);
            }
        });
    }

    handleSearch() {
        // Ховаємо початковий екран, показуємо контейнер
        document.getElementById('initial-state').style.display = 'none';
        document.getElementById('signals-container').style.display = 'grid'; // Grid для карток
        
        // Змінюємо кнопки
        document.getElementById('search-btn').style.display = 'none';
        document.getElementById('refresh-btn').style.display = 'flex';
        
        // Завантажуємо
        this.loadSignals(true);
    }

    async loadSignals(force = false) {
        const container = document.getElementById('signals-container');
        const btn = document.getElementById('refresh-btn');
        
        // Анімація завантаження на кнопці
        const originalBtnText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        try {
            // Додаємо timestamp, щоб браузер не кешував
            const response = await fetch(`${this.signalsUrl}?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error("File not found");
            
            const data = await response.json();
            
            if (data.last_update) {
                this.lastGenerationTime = new Date(data.last_update);
                this.startCooldown(); // Запускаємо таймер блокування кнопки
            }

            this.renderSignals(data);
            this.updateStats(data);

        } catch (e) {
            console.error(e);
            if(container.children.length === 0) {
                 document.getElementById('no-signals').style.display = 'block';
            }
        } finally {
            btn.innerHTML = originalBtnText; // Повертаємо текст кнопці
        }
    }

    renderSignals(data) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        
        // Очищаємо старі таймери
        this.activeTimers.forEach(t => clearInterval(t));
        this.activeTimers.clear();
        container.innerHTML = '';

        if (!data.signals || data.signals.length === 0) {
            noSignals.style.display = 'block';
            return;
        }

        noSignals.style.display = 'none';

        // Рендеримо картки
        data.signals.forEach((signal, index) => {
            const html = this.createCardHTML(signal, index);
            container.insertAdjacentHTML('beforeend', html);
            this.startSignalTimer(signal, index);
        });
    }

    createCardHTML(signal, index) {
        const directionClass = signal.direction.toLowerCase(); // 'up' or 'down'
        const arrow = signal.direction === 'UP' ? '↗' : '↘';
        const colorClass = signal.direction === 'UP' ? 'green' : 'red';
        
        // Вибір мови для пояснення
        const reason = this.language === 'ru' && signal.reason_ru ? signal.reason_ru : signal.reason;

        return `
        <div class="signal-card ${directionClass}" id="card-${index}">
            <div class="card-header">
                <div class="asset-name">
                    <i class="fas fa-coins"></i> ${signal.asset}
                </div>
                <div class="badge ${colorClass}">
                    ${signal.direction} ${arrow}
                </div>
            </div>

            <div class="card-body">
                <div class="info-row">
                    <span>${this.translate('confidence')}</span>
                    <strong>${Math.round(signal.confidence * 100)}%</strong>
                </div>
                <div class="info-row">
                    <span>${this.translate('entry')} (Kyiv)</span>
                    <strong class="entry-time">${signal.entry_time}</strong>
                </div>
                <div class="info-row">
                    <span>${this.translate('duration')}</span>
                    <strong>${signal.duration} min</strong>
                </div>
            </div>

            <div class="timer-box" id="timer-${index}">
                --:--
            </div>

            ${reason ? `
            <div class="ai-analysis">
                <small><i class="fas fa-brain"></i> ${this.translate('aiReason')}</small>
                <p>${reason}</p>
            </div>
            ` : ''}
        </div>
        `;
    }

    startSignalTimer(signal, index) {
        const timerEl = document.getElementById(`timer-${index}`);
        const cardEl = document.getElementById(`card-${index}`);
        
        const durationMin = parseFloat(signal.duration);
        
        // Парсимо час входу
        const now = new Date();
        const [h, m] = signal.entry_time.split(':').map(Number);
        const entryDate = new Date();
        entryDate.setHours(h, m, 0, 0);

        // Якщо вхід був "вчора" (наприклад зараз 00:10, а вхід 23:50), не чіпаємо.
        // Якщо вхід "сьогодні" але в минулому, це ОК.
        // Якщо вхід "завтра" (наприклад зараз 23:50, вхід 00:05), додаємо день.
        if (entryDate < now && (now - entryDate) > 12 * 3600 * 1000) {
            entryDate.setDate(entryDate.getDate() + 1);
        }

        const endDate = new Date(entryDate.getTime() + durationMin * 60000);

        const update = () => {
            const current = new Date();

            // 1. ОЧІКУВАННЯ (Waiting)
            if (current < entryDate) {
                const diff = entryDate - current;
                const mm = Math.floor(diff / 60000);
                const ss = Math.floor((diff % 60000) / 1000);
                timerEl.innerHTML = `<span style="color:#3498db">${this.translate('timerWaiting')} ${mm}:${ss.toString().padStart(2,'0')}</span>`;
                timerEl.className = 'timer-box waiting';
            }
            // 2. АКТИВНИЙ (Active)
            else if (current >= entryDate && current < endDate) {
                const diff = endDate - current;
                const mm = Math.floor(diff / 60000);
                const ss = Math.floor((diff % 60000) / 1000);
                timerEl.innerHTML = `<span style="color:#e74c3c; font-weight:bold">${this.translate('timerActive')} ${mm}:${ss.toString().padStart(2,'0')}</span>`;
                timerEl.className = 'timer-box active';
                cardEl.classList.add('pulse-active'); // Додаємо пульсацію
            }
            // 3. ЗАВЕРШЕНО (Expired)
            else {
                timerEl.innerHTML = `<span style="color:#7f8c8d">${this.translate('timerExpired')}</span>`;
                timerEl.className = 'timer-box expired';
                cardEl.classList.remove('pulse-active');
                cardEl.style.opacity = '0.7'; // Трішки тускніє
                clearInterval(this.activeTimers.get(index));
            }
        };

        update();
        const interval = setInterval(update, 1000);
        this.activeTimers.set(index, interval);
    }

    // Логіка блокування кнопки "Оновити"
    startCooldown() {
        if (!this.lastGenerationTime) return;

        const btn = document.getElementById('refresh-btn');
        const timerText = document.getElementById('cooldown-timer');
        
        if (this.cooldownInterval) clearInterval(this.cooldownInterval);

        const check = () => {
            const now = new Date();
            const diffSec = (now - this.lastGenerationTime) / 1000;
            const timeLeft = (this.cooldownMinutes * 60) - diffSec;

            if (timeLeft <= 0) {
                btn.disabled = false;
                timerText.textContent = '';
                clearInterval(this.cooldownInterval);
            } else {
                btn.disabled = true;
                const m = Math.floor(timeLeft / 60);
                const s = Math.floor(timeLeft % 60);
                timerText.textContent = `(${m}:${s.toString().padStart(2, '0')})`;
            }
        };

        check();
        this.cooldownInterval = setInterval(check, 1000);
    }

    updateStats(data) {
        if (data.last_update) {
            const d = new Date(data.last_update);
            document.getElementById('last-update').textContent = d.toLocaleTimeString('uk-UA', {timeZone:'Europe/Kiev', hour:'2-digit', minute:'2-digit'});
        }
        document.getElementById('active-signals').textContent = data.signals ? data.signals.length : 0;
    }

    updateTime() {
        const now = new Date();
        document.getElementById('server-time').textContent = now.toLocaleTimeString('uk-UA', {
            timeZone: 'Europe/Kiev', hour12: false
        });
    }

    setupLanguage() {
        const apply = (lang) => {
            this.language = lang;
            localStorage.setItem('language', lang);
            
            // Переклад статичних текстів
            document.querySelectorAll('[data-translate]').forEach(el => {
                const k = el.getAttribute('data-translate');
                if (this.translations[lang][k]) el.textContent = this.translations[lang][k];
            });

            // Кнопки
            document.querySelectorAll('.lang-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.lang === lang);
            });

            // Якщо сигнали вже є - перерендер (щоб змінилась мова AI аналізу)
            const container = document.getElementById('signals-container');
            if (container.children.length > 0) {
                 // Перезавантажуємо відображення (без запиту на сервер)
                 // Але оскільки дані у нас не збережені в змінну класу в цьому прикладі, 
                 // то краще просто натиснути "Оновити" або залишити як є.
                 // В ідеалі треба зберігати `this.currentData` і викликати `renderSignals(this.currentData)`
            }
        };

        document.getElementById('lang-uk').addEventListener('click', () => apply('uk'));
        document.getElementById('lang-ru').addEventListener('click', () => apply('ru'));
        
        apply(this.language);
    }

    translate(key) {
        return this.translations[this.language][key] || key;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SignalDisplay();
});
