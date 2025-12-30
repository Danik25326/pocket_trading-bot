class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.kyivOffset = 2; // UTC+2 (зимній) / UTC+3 (літній) - будемо брати з локального часу
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.lastGenerationTime = null;
        this.cooldownMinutes = 5;
        this.translations = {
            uk: {
                title: "AI Trading Signals",
                subtitle: "Автоматичні сигнали для бінарних опціонів з використанням GPT-OSS-120b",
                updateMode: "Режим:",
                onDemand: "За запитом",
                minAccuracy: "Мін. точність:",
                model: "Модель:",
                lastUpdate: "Останнє оновлення",
                kievTime: "(Київський час)",
                activeSignals: "Активних сигналів",
                withConfidence: "з впевненістю >70%",
                currentSignals: "Актуальні сигнали",
                serverTime: "Поточний час:",
                loadingSignals: "Аналіз графіків...",
                noSignalsNow: "Наразі немає актуальних сигналів",
                waitForUpdate: "Спробуйте пізніше",
                searchBtn: "Пошук сигналів",
                updateBtn: "Оновити",
                pressSearch: "Натисніть 'Пошук сигналів'",
                searchDesc: "Система проаналізує ринок та знайде найкращі точки входу",
                timerWaiting: "Вхід через:",
                timerActive: "Таймер активний:",
                timerExpired: "Завершено",
                signalCorrect: "Сигнал вірний?",
                replyYes: "Так",
                replyNo: "Ні",
                replySkip: "Пропустити",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так",
                feedbackNo: "Ні",
                feedbackSkip: "Не перевіряв"
            },
            ru: {
                title: "AI Торговые Сигналы",
                subtitle: "Автоматические сигналы для бинарных опционов с использованием GPT-OSS-120b",
                updateMode: "Режим:",
                onDemand: "По запросу",
                minAccuracy: "Мин. точность:",
                model: "Модель:",
                lastUpdate: "Последнее обновление",
                kievTime: "(Киевское время)",
                activeSignals: "Активных сигналов",
                withConfidence: "с уверенностью >70%",
                currentSignals: "Актуальные сигналы",
                serverTime: "Текущее время:",
                loadingSignals: "Анализ графиков...",
                noSignalsNow: "В настоящее время нет актуальных сигналов",
                waitForUpdate: "Попробуйте позже",
                searchBtn: "Поиск сигналов",
                updateBtn: "Обновить",
                pressSearch: "Нажмите 'Поиск сигналов'",
                searchDesc: "Система проанализирует рынок и найдет лучшие точки входа",
                timerWaiting: "Вход через:",
                timerActive: "Таймер активен:",
                timerExpired: "Завершено",
                signalCorrect: "Сигнал верный?",
                replyYes: "Да",
                replyNo: "Нет",
                replySkip: "Пропустить",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да",
                feedbackNo: "Нет",
                feedbackSkip: "Не проверял"
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Обробник кнопки "Пошук"
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch();
        });

        // Обробник кнопки "Оновити"
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.handleRefresh();
        });
    }

    handleSearch() {
        document.getElementById('initial-state').style.display = 'none';
        document.getElementById('signals-container').style.display = 'block';
        document.getElementById('search-btn').style.display = 'none';
        document.getElementById('refresh-btn').style.display = 'flex';
        
        this.loadSignals(true);
    }

    handleRefresh() {
        if (this.canUpdate()) {
            this.loadSignals(true);
        }
    }

    canUpdate() {
        if (!this.lastGenerationTime) return true;
        const now = new Date();
        const diff = (now - this.lastGenerationTime) / 60000; // різниця в хвилинах
        return diff >= this.cooldownMinutes;
    }

    updateCooldownButton() {
        const btn = document.getElementById('refresh-btn');
        const timerSpan = document.getElementById('cooldown-timer');
        
        if (!this.lastGenerationTime) {
            btn.disabled = false;
            timerSpan.textContent = "";
            return;
        }

        const now = new Date();
        const diffSeconds = (now - this.lastGenerationTime) / 1000;
        const secondsLeft = (this.cooldownMinutes * 60) - diffSeconds;

        if (secondsLeft <= 0) {
            btn.disabled = false;
            btn.classList.remove('disabled');
            timerSpan.textContent = "";
        } else {
            btn.disabled = true;
            btn.classList.add('disabled');
            const m = Math.floor(secondsLeft / 60);
            const s = Math.floor(secondsLeft % 60);
            timerSpan.textContent = `(${m}:${s.toString().padStart(2, '0')})`;
            
            // Оновлюємо таймер кнопки кожну секунду
            if (!this.cooldownInterval) {
                this.cooldownInterval = setInterval(() => this.updateCooldownButton(), 1000);
            }
        }
    }

    async loadSignals(force = false) {
        try {
            const timestamp = new Date().getTime();
            // Додаємо timestamp щоб уникнути кешування браузером
            const response = await fetch(`${this.signalsUrl}?t=${timestamp}`);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            // Якщо це перший пошук, або "силове" оновлення
            this.processSignals(data);
            
            // Встановлюємо час останньої генерації з файлу (це важливо для кнопки Оновити)
            if (data.last_update) {
                this.lastGenerationTime = new Date(data.last_update);
                this.updateCooldownButton();
            }

        } catch (error) {
            console.error('Помилка завантаження:', error);
            this.showError('Не вдалося завантажити сигнали. Перевірте з\'єднання.');
        }
    }

    processSignals(data) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        const lastUpdate = document.getElementById('last-update');
        const activeSignalsElement = document.getElementById('active-signals');
        
        if (!data || !data.signals || data.signals.length === 0) {
            container.innerHTML = '';
            noSignals.style.display = 'block';
            activeSignalsElement.textContent = '0';
            return;
        }
        
        noSignals.style.display = 'none';
        
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        let html = '';
        let activeCount = 0;
        
        // Очищаємо старі таймери
        this.activeTimers.forEach((timerId) => clearInterval(timerId));
        this.activeTimers.clear();

        data.signals.forEach((signal, index) => {
            activeCount++;
            const signalId = `signal-${index}`;
            html += this.createSignalHTML(signal, signalId);
        });
        
        activeSignalsElement.textContent = activeCount;
        container.innerHTML = html;

        // Запускаємо таймери для кожного сигналу
        data.signals.forEach((signal, index) => {
            const signalId = `signal-${index}`;
            this.setupSignalTimer(signal, signalId);
        });
    }

    createSignalHTML(signal, signalId) {
        const confidencePercent = Math.round(signal.confidence * 100);
        const confidenceClass = this.getConfidenceClass(confidencePercent);
        const directionClass = signal.direction.toLowerCase();
        
        // Вибираємо мову опису
        const reasonText = this.language === 'ru' && signal.reason_ru ? signal.reason_ru : signal.reason;

        // Конвертуємо час
        let generatedTime = 'Unknown';
        if (signal.generated_at) {
            generatedTime = this.formatTime(new Date(signal.generated_at), false);
        }

        return `
            <div class="signal-card ${directionClass}" id="${signalId}" data-asset="${signal.asset}">
                <div class="signal-header">
                    <div class="asset-info">
                        <div class="asset-icon"><i class="fas fa-chart-line"></i></div>
                        <div>
                            <div class="asset-name">${signal.asset}</div>
                            <small>Таймфрейм: ${signal.duration} хв | Київ</small>
                        </div>
                    </div>
                    <div class="direction-badge">
                        ${signal.direction === 'UP' ? '📈 CALL' : '📉 PUT'}
                    </div>
                </div>
                
                <div class="signal-details">
                    <div class="detail-item">
                        <div class="label"><i class="fas fa-bullseye"></i> ${this.translate('minAccuracy')}</div>
                        <div class="value">${confidencePercent}% <span class="confidence-badge ${confidenceClass}">OK</span></div>
                    </div>
                    <div class="detail-item">
                        <div class="label"><i class="far fa-clock"></i> Вхід (Київ)</div>
                        <div class="value">${signal.entry_time}</div>
                    </div>
                    <div class="detail-item">
                        <div class="label"><i class="fas fa-hourglass-half"></i> Тривалість</div>
                        <div class="value">${signal.duration} хв</div>
                    </div>
                    <div class="detail-item">
                        <div class="label"><i class="fas fa-calendar"></i> Створено</div>
                        <div class="value">${generatedTime}</div>
                    </div>
                </div>
                
                <div class="timer-container" id="timer-${signalId}"></div>
                
                ${reasonText ? `
                <div class="signal-reason">
                    <div class="reason-header"><i class="fas fa-lightbulb"></i> AI Аналіз</div>
                    <div class="reason-text">${reasonText}</div>
                </div>
                ` : ''}
            </div>
        `;
    }

    setupSignalTimer(signal, signalId) {
        const timerContainer = document.getElementById(`timer-${signalId}`);
        if (!timerContainer) return;

        const durationMinutes = parseFloat(signal.duration) || 2;
        
        // Парсинг часу входу HH:MM у об'єкт Date (Сьогодні)
        const now = new Date();
        const [hours, minutes] = signal.entry_time.split(':').map(Number);
        
        const entryDate = new Date();
        entryDate.setHours(hours, minutes, 0, 0);

        // Якщо час входу менше ніж "зараз" мінус 12 годин, значить це було вчора (або помилка). 
        // Якщо час входу менше ніж "зараз", але недалеко, значить ми запізнилися або сигнал йде.
        // Для простоти припускаємо, що сигнал завжди на сьогодні або завтра.
        if (entryDate < now && (now - entryDate) > 12 * 60 * 60 * 1000) {
             entryDate.setDate(entryDate.getDate() + 1);
        }

        const endDate = new Date(entryDate.getTime() + durationMinutes * 60000);

        const updateTimer = () => {
            const currentTime = new Date();
            
            // 1. Чекаємо входу
            if (currentTime < entryDate) {
                const diff = entryDate - currentTime;
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                timerContainer.innerHTML = `
                    <div class="signal-timer waiting">
                        <div class="timer-display"><i class="fas fa-pause"></i> ${m}:${s.toString().padStart(2, '0')}</div>
                        <small>${this.translate('timerWaiting')}</small>
                    </div>`;
            } 
            // 2. Сигнал активний (йде таймер)
            else if (currentTime >= entryDate && currentTime < endDate) {
                const diff = endDate - currentTime;
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                timerContainer.innerHTML = `
                    <div class="signal-timer active">
                        <div class="timer-display"><i class="fas fa-hourglass-half"></i> ${m}:${s.toString().padStart(2, '0')}</div>
                        <small>${this.translate('timerActive')}</small>
                    </div>`;
            } 
            // 3. Час вийшов
            else {
                timerContainer.innerHTML = `
                    <div class="signal-feedback">
                        <p>${this.translate('timerExpired')}</p>
                    </div>`;
                // Зупиняємо таймер
                clearInterval(this.activeTimers.get(signalId));
            }
        };

        updateTimer(); // Перший виклик
        const intervalId = setInterval(updateTimer, 1000);
        this.activeTimers.set(signalId, intervalId);
    }

    updateKyivTime() {
        const now = new Date();
        const options = { timeZone: 'Europe/Kiev', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        document.getElementById('server-time').textContent = now.toLocaleTimeString('uk-UA', options);
    }

    formatTime(date, includeSeconds) {
        return date.toLocaleTimeString('uk-UA', {
            timeZone: 'Europe/Kiev',
            hour: '2-digit',
            minute: '2-digit',
            second: includeSeconds ? '2-digit' : undefined
        });
    }

    getConfidenceClass(percent) {
        if (percent >= 85) return 'confidence-high';
        if (percent >= 75) return 'confidence-medium';
        return 'confidence-low';
    }
    
    // Переклад
    async setupLanguage() {
        this.applyLanguage(this.language);
        document.getElementById('lang-uk').addEventListener('click', () => this.switchLanguage('uk'));
        document.getElementById('lang-ru').addEventListener('click', () => this.switchLanguage('ru'));
    }

    switchLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage(lang);
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
        // Перемальовуємо сигнали щоб оновити текст AI
        const container = document.getElementById('signals-container');
        if (container.children.length > 0 && !container.querySelector('.loading-state')) {
             // Перезавантажуємо відображення з кешу (data/signals.json) - насправді треба просто оновити DOM
             // Для простоти можна просто перезавантажити сторінку або викликати loadSignals знову
             this.loadSignals(); 
        }
    }

    applyLanguage(lang) {
        const translations = this.translations[lang];
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[key]) el.textContent = translations[key];
        });
    }

    translate(key) {
        return this.translations[this.language][key] || key;
    }

    showError(msg) {
        const container = document.getElementById('signals-container');
        container.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>${msg}</p></div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.signalDisplay = new SignalDisplay();
});
