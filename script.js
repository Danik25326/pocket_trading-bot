class SignalDisplay {
    constructor() {
        this.signalsUrl = 'signals.json'; 
        this.historyUrl = 'history.json';
        this.updateInterval = 5000; // Перевірка кожні 5 секунд
        this.kyivOffset = 2; // UTC+2 для Києва (але використовуємо API)
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.translations = {
            uk: {
                title: "AI Trading Signals",
                subtitle: "Автоматичні сигнали для бінарних опціонів з використанням Llama 4 AI",
                updateEvery: "Оновлення:",
                minAccuracy: "Мін. точність:",
                model: "Модель:",
                lastUpdate: "Останнє оновлення",
                kievTime: "(Київський час)",
                activeSignals: "Активних сигналів",
                withConfidence: "з впевненістю >70%",
                totalStats: "Загальна статистика",
                signalsInHistory: "сигналів в історії",
                successRate: "Успішність",
                historicalAccuracy: "історична точність",
                currentSignals: "Актуальні сигнали",
                serverTime: "Поточний час:",
                loadingSignals: "Завантаження сигналів...",
                autoUpdate: "Сигнали оновлюються автоматично",
                noSignalsNow: "Наразі немає актуальних сигналів",
                waitForUpdate: "Очікуйте наступного оновлення",
                howItWorks: "Як працює система",
                aiAnalysis: "AI Аналіз:",
                aiAnalysisDesc: "Llama 4 для технічного аналізу",
                realTimeData: "Дані в реальному часі:",
                realTimeDataDesc: "Отримання з PocketOption API",
                filtering: "Фільтрація:",
                filteringDesc: "Тільки сигнали >70% та не старіші 5 хв",
                updates: "Оновлення:",
                updatesDesc: "Кожні 5 хвилин для нових сигналів",
                important: "Важливо!",
                disclaimer: "Торгівля містить високі ризики. Сигнали не є фінансовою рекомендацією.",
                createdWith: "Створено з використанням",
                technologies: "Технології:",
                updateBtn: "Оновити",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так",
                feedbackNo: "Ні",
                feedbackSkip: "Я не перевіряв",
                timerActive: "Таймер активний:",
                timerExpired: "Час вийшов",
                signalCorrect: "Сигнал вірний?",
                replyYes: "Так",
                replyNo: "Ні",
                replySkip: "Пропустити"
            },
            ru: {
                title: "AI Торговые Сигналы",
                subtitle: "Автоматические сигналы для бинарных опционов с использованием Llama 4 AI",
                updateEvery: "Обновление:",
                minAccuracy: "Мин. точность:",
                model: "Модель:",
                lastUpdate: "Последнее обновление",
                kievTime: "(Киевское время)",
                activeSignals: "Активных сигналов",
                withConfidence: "с уверенностью >70%",
                totalStats: "Общая статистика",
                signalsInHistory: "сигналов в истории",
                successRate: "Успешность",
                historicalAccuracy: "историческая точность",
                currentSignals: "Актуальные сигналы",
                serverTime: "Текущее время:",
                loadingSignals: "Загрузка сигналов...",
                autoUpdate: "Сигналы обновляются автоматически",
                noSignalsNow: "В настоящее время нет актуальных сигналов",
                waitForUpdate: "Ожидайте следующего обновления",
                howItWorks: "Как работает система",
                aiAnalysis: "AI Анализ:",
                aiAnalysisDesc: "Llama 4 для технического анализа",
                realTimeData: "Данные в реальном времени:",
                realTimeDataDesc: "Получение из PocketOption API",
                filtering: "Фильтрация:",
                filteringDesc: "Только сигналы >70% и не старше 5 мин",
                updates: "Обновления:",
                updatesDesc: "Каждые 5 минут для новых сигналов",
                important: "Важно!",
                disclaimer: "Торговля содержит высокие риски. Сигналы не являются финансовой рекомендацией.",
                createdWith: "Создано с использованием",
                technologies: "Технологии:",
                updateBtn: "Обновить",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да",
                feedbackNo: "Нет",
                feedbackSkip: "Я не проверял",
                timerActive: "Таймер активен:",
                timerExpired: "Время вышло",
                signalCorrect: "Сигнал верный?",
                replyYes: "Да",
                replyNo: "Нет",
                replySkip: "Пропустить"
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        await this.loadSignals();
        this.startAutoUpdate();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Додаємо обробник для кнопки оновлення
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.forceRefresh();
        });
    }

    async loadSignals(force = false) {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${this.signalsUrl}?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.processSignals(data, force);
            
        } catch (error) {
            console.error('Помилка завантаження:', error);
            this.showError('Не вдалося завантажити сигнали. Спробуйте пізніше.');
        }
    }

    processSignals(data, force = false) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        const lastUpdate = document.getElementById('last-update');
        const activeSignalsElement = document.getElementById('active-signals');
        
        if (!data || !data.signals || data.signals.length === 0) {
            container.innerHTML = '';
            noSignals.style.display = 'block';
            lastUpdate.textContent = '--:--:--';
            activeSignalsElement.textContent = '0';
            return;
        }
        
        noSignals.style.display = 'none';
        
        // Оновлюємо час останнього оновлення
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        // Фільтруємо сигнали
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
        
        let activeSignals = 0;
        let html = '';
        
        data.signals.forEach((signal, index) => {
            // Фільтрація: confidence > 70% та не старіші 5 хвилин
            const confidencePercent = Math.round(signal.confidence * 100);
            if (confidencePercent < 70) return;
            
            const generatedAt = new Date(signal.generated_at);
            if (generatedAt < fiveMinutesAgo && !force) return;
            
            activeSignals++;
            
            // Перевіряємо, чи є таймер для цього сигналу
            const signalId = `signal-${index}`;
            const timerData = this.activeTimers.get(signalId);
            
            html += this.createSignalHTML(signal, signalId, timerData);
        });
        
        activeSignalsElement.textContent = activeSignals;
        
        if (activeSignals === 0) {
            noSignals.style.display = 'block';
            container.innerHTML = '';
        } else {
            container.innerHTML = html;
            
            // Запускаємо таймери для всіх сигналів
            data.signals.forEach((signal, index) => {
                const signalId = `signal-${index}`;
                this.setupSignalTimer(signal, signalId);
            });
        }
    }

    createSignalHTML(signal, signalId, timerData) {
        const confidencePercent = Math.round(signal.confidence * 100);
        const confidenceClass = this.getConfidenceClass(confidencePercent);
        const directionClass = signal.direction.toLowerCase();
        const entryTime = signal.entry_time || 'Не вказано';
        const duration = signal.duration || '2';
        const maxDuration = 5; // Максимум 5 хвилин
        
        // Конвертуємо час генерації в Київський
        let generatedTime = 'Не вказано';
        if (signal.generated_at) {
            const genDate = new Date(signal.generated_at);
            generatedTime = this.formatTime(genDate, false);
        }
        
        let timerHTML = '';
        if (timerData) {
            if (timerData.isActive) {
                timerHTML = `
                    <div class="signal-timer active">
                        <div class="timer-display">
                            <i class="fas fa-hourglass-half"></i> 
                            <span class="timer-text">${timerData.timeLeft}</span>
                        </div>
                        <small>${this.translate('timerActive')}</small>
                    </div>
                `;
            } else if (timerData.isExpired) {
                timerHTML = `
                    <div class="signal-feedback">
                        <p>${this.translate('signalCorrect')}</p>
                        <div class="feedback-buttons">
                            <button class="feedback-btn feedback-yes" onclick="signalDisplay.giveFeedback('${signalId}', 'yes')">
                                ${this.translate('replyYes')}
                            </button>
                            <button class="feedback-btn feedback-no" onclick="signalDisplay.giveFeedback('${signalId}', 'no')">
                                ${this.translate('replyNo')}
                            </button>
                            <button class="feedback-btn feedback-skip" onclick="signalDisplay.giveFeedback('${signalId}', 'skip')">
                                ${this.translate('replySkip')}
                            </button>
                        </div>
                    </div>
                `;
            }
        }
        
        return `
            <div class="signal-card ${directionClass}" id="${signalId}" data-asset="${signal.asset}">
                <div class="signal-header">
                    <div class="asset-info">
                        <div class="asset-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div>
                            <div class="asset-name">${signal.asset}</div>
                            <small>Таймфрейм: ${duration} хв | Київський час</small>
                        </div>
                    </div>
                    <div class="direction-badge">
                        ${signal.direction === 'UP' ? '📈 CALL' : '📉 PUT'}
                    </div>
                </div>
                
                <div class="signal-details">
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-bullseye"></i> ${this.translate('withConfidence').replace('з ', '')}
                        </div>
                        <div class="value">
                            ${confidencePercent}%
                            <span class="confidence-badge ${confidenceClass}">
                                ${confidencePercent >= 80 ? 'Висока' : confidencePercent >= 70 ? 'Середня' : 'Низька'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="far fa-clock"></i> Час входу
                        </div>
                        <div class="value">
                            ${entryTime}
                            <small style="display: block; font-size: 0.8em; color: #666;">(Київ)</small>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-hourglass-half"></i> Тривалість
                        </div>
                        <div class="value">${duration} хв (макс. ${maxDuration} хв)</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-calendar"></i> Створено
                        </div>
                        <div class="value">${generatedTime}</div>
                    </div>
                </div>
                
                ${timerHTML}
                
                ${signal.reason ? `
                <div class="signal-reason">
                    <div class="reason-header">
                        <i class="fas fa-lightbulb"></i> Аналіз AI
                    </div>
                    <div class="reason-text">${signal.reason}</div>
                </div>
                ` : ''}
                
                <div class="signal-footer">
                    <span><i class="fas fa-globe-europe"></i> Часова зона: Київ (UTC+2)</span>
                    <span><i class="fas fa-brain"></i> Модель: Llama 4</span>
                </div>
            </div>
        `;
    }

    setupSignalTimer(signal, signalId) {
        const entryTime = signal.entry_time;
        const duration = parseFloat(signal.duration) || 2;
        
        if (!entryTime) return;
        
        // Парсимо час входу (формат HH:MM)
        const [hours, minutes] = entryTime.split(':').map(Number);
        const now = new Date();
        const entryDate = new Date(now);
        entryDate.setHours(hours, minutes, 0, 0);
        
        // Якщо час входу вже минув сьогодні, то це на наступний день
        if (entryDate < now) {
            entryDate.setDate(entryDate.getDate() + 1);
        }
        
        const endDate = new Date(entryDate.getTime() + duration * 60000);
        
        const updateTimer = () => {
            const now = new Date();
            const timeLeft = endDate - now;
            
            if (timeLeft > 0) {
                // Таймер активний
                const minutesLeft = Math.floor(timeLeft / 60000);
                const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
                
                this.activeTimers.set(signalId, {
                    isActive: true,
                    isExpired: false,
                    timeLeft: `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`
                });
                
                // Оновлюємо відображення
                const timerElement = document.querySelector(`#${signalId} .signal-timer`);
                if (timerElement) {
                    const timerText = timerElement.querySelector('.timer-text');
                    if (timerText) {
                        timerText.textContent = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
                    }
                }
            } else if (timeLeft > -60000) { // Минула 1 хвилина після завершення
                // Таймер завершився, показуємо фідбек
                this.activeTimers.set(signalId, {
                    isActive: false,
                    isExpired: true,
                    timeLeft: '0:00'
                });
                
                // Оновлюємо відображення
                const signalElement = document.getElementById(signalId);
                if (signalElement) {
                    const timerHTML = `
                        <div class="signal-feedback">
                            <p>${this.translate('signalCorrect')}</p>
                            <div class="feedback-buttons">
                                <button class="feedback-btn feedback-yes" onclick="signalDisplay.giveFeedback('${signalId}', 'yes')">
                                    ${this.translate('replyYes')}
                                </button>
                                <button class="feedback-btn feedback-no" onclick="signalDisplay.giveFeedback('${signalId}', 'no')">
                                    ${this.translate('replyNo')}
                                </button>
                                <button class="feedback-btn feedback-skip" onclick="signalDisplay.giveFeedback('${signalId}', 'skip')">
                                    ${this.translate('replySkip')}
                                </button>
                            </div>
                        </div>
                    `;
                    
                    const timerElement = signalElement.querySelector('.signal-timer');
                    if (timerElement) {
                        timerElement.outerHTML = timerHTML;
                    }
                }
            } else {
                // Більше 1 хвилини після завершення - видаляємо таймер
                this.activeTimers.delete(signalId);
                const signalElement = document.getElementById(signalId);
                if (signalElement) {
                    signalElement.remove();
                    this.updateSignalCount();
                }
            }
        };
        
        // Запускаємо таймер
        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        
        // Зберігаємо ID інтервалу для очищення
        this.activeTimers.set(signalId + '-interval', intervalId);
    }

    giveFeedback(signalId, feedback) {
        const signalElement = document.getElementById(signalId);
        if (!signalElement) return;
        
        const asset = signalElement.dataset.asset;
        
        // Відправляємо фідбек на сервер (заглушка)
        console.log(`Feedback for ${asset}: ${feedback}`);
        
        // Видаляємо сигнал
        signalElement.remove();
        this.updateSignalCount();
        
        // Очищаємо таймер
        const intervalId = this.activeTimers.get(signalId + '-interval');
        if (intervalId) {
            clearInterval(intervalId);
            this.activeTimers.delete(signalId + '-interval');
        }
        this.activeTimers.delete(signalId);
        
        // Перевіряємо, чи потрібно оновити сигнали
        setTimeout(() => this.checkForNewSignals(), 1000);
    }

    updateSignalCount() {
        const container = document.getElementById('signals-container');
        const activeSignals = container.querySelectorAll('.signal-card').length;
        document.getElementById('active-signals').textContent = activeSignals;
        
        if (activeSignals === 0) {
            document.getElementById('no-signals').style.display = 'block';
        }
    }

    checkForNewSignals() {
        // Перевіряємо, чи є сигнали старіші 5 хвилин
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
        
        // Якщо всі сигнали завершені, завантажуємо нові
        this.loadSignals(true);
    }

    forceRefresh() {
        const btn = document.getElementById('refresh-btn');
        btn.classList.add('spinning');
        
        // Примусове оновлення
        this.loadSignals(true).finally(() => {
            setTimeout(() => {
                btn.classList.remove('spinning');
            }, 1000);
        });
    }

    updateKyivTime() {
        // Використовуємо вбудовану підтримку часових зон
        const now = new Date();
        const timeElement = document.getElementById('server-time');
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('uk-UA', {
                timeZone: 'Europe/Kiev',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    formatTime(date, includeSeconds = false) {
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

    showError(message) {
        const container = document.getElementById('signals-container');
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Помилка</h3>
                <p>${message}</p>
                <button onclick="signalDisplay.forceRefresh()" class="refresh-btn">
                    <i class="fas fa-redo"></i> Спробувати знову
                </button>
            </div>
        `;
    }

    startAutoUpdate() {
        // Оновлюємо дані кожні 30 секунд
        setInterval(() => {
            this.loadSignals();
        }, 30000);
        
        // Оновлюємо при поверненні на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadSignals();
                this.updateKyivTime();
            }
        });
    }

    async setupLanguage() {
        // Встановлюємо початкову мову
        this.applyLanguage(this.language);
        
        // Додаємо обробники для перемикача мов
        document.getElementById('lang-uk').addEventListener('click', () => {
            this.switchLanguage('uk');
        });
        
        document.getElementById('lang-ru').addEventListener('click', () => {
            this.switchLanguage('ru');
        });
    }

    switchLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage(lang);
        
        // Оновлюємо активні кнопки
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    applyLanguage(lang) {
        const translations = this.translations[lang];
        if (!translations) return;
        
        // Оновлюємо всі елементи з data-translate
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                if (element.classList.contains('btn-text')) {
                    element.textContent = translations[key];
                } else {
                    element.textContent = translations[key];
                }
            }
        });
    }

    translate(key) {
        return this.translations[this.language][key] || key;
    }
}

// Глобальна змінна для доступу з HTML
let signalDisplay;

// Запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    signalDisplay = new SignalDisplay();
    window.signalDisplay = signalDisplay; // Робимо глобально доступним
});
