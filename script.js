
class SignalDisplay {
    constructor() {
        this.currentLang = 'uk';
        this.activeSignals = [];
        this.timers = {};
        this.translations = {
            uk: {
                title: "AI Trading Signals",
                subtitle: "Автоматичні сигнали для бінарних опціонів з використанням Llama 4 AI",
                updateBtn: "Оновити",
                updateEvery: "Оновлення:",
                minAccuracy: "Мін. точність:",
                model: "Модель:",
                lastUpdate: "Останнє оновлення",
                activeSignals: "Активних сигналів",
                withConfidence: "з впевненістю >70%",
                totalStats: "Загальна статистика",
                signalsInHistory: "сигналів в історії",
                successRate: "Успішність",
                historicalAccuracy: "історична точність",
                currentSignals: "Актуальні сигнали",
                serverTime: "Час сервера",
                loadingSignals: "Завантаження сигналів...",
                autoUpdate: "Сигнали оновлюються автоматично кожні 10 секунд",
                noSignalsNow: "Наразі немає сигналів",
                waitForUpdate: "Очікуйте наступного оновлення (кожні 5 хвилин)",
                howItWorks: "Як працює система",
                aiAnalysis: "AI Аналіз:",
                aiAnalysisDesc: "Використовується Llama 4 Maverick для технічного аналізу",
                realTimeData: "Дані в реальному часі:",
                realTimeDataDesc: "Отримання з PocketOption API",
                filtering: "Фільтрація:",
                filteringDesc: "Показуються тільки сигнали з впевненістю >70%",
                updates: "Оновлення:",
                updatesDesc: "Автоматичне оновлення кожні 5 хвилин",
                important: "Важливо!",
                disclaimer: "Це навчальний проект. Торгівля бінарними опціонами містить високі ризики втрати коштів. Сигнали не є фінансовою рекомендацією.",
                createdWith: "Створено з використанням",
                technologies: "Технології:",
                confidence: "Впевненість",
                entryTime: "Час входу",
                duration: "Тривалість",
                created: "Створено",
                analysis: "Аналіз AI",
                timezone: "Часова зона: Київ (UTC+2)",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так",
                feedbackNo: "Ні",
                feedbackSkip: "Я не перевіряв"
            },
            ru: {
                title: "AI Торговые Сигналы",
                subtitle: "Автоматические сигналы для бинарных опционов с использованием Llama 4 AI",
                updateBtn: "Обновить",
                updateEvery: "Обновление:",
                minAccuracy: "Мин. точность:",
                model: "Модель:",
                lastUpdate: "Последнее обновление",
                activeSignals: "Активных сигналов",
                withConfidence: "с уверенностью >70%",
                totalStats: "Общая статистика",
                signalsInHistory: "сигналов в истории",
                successRate: "Успешность",
                historicalAccuracy: "историческая точность",
                currentSignals: "Актуальные сигналы",
                serverTime: "Время сервера",
                loadingSignals: "Загрузка сигналов...",
                autoUpdate: "Сигналы обновляются автоматически каждые 10 секунд",
                noSignalsNow: "Сейчас нет сигналов",
                waitForUpdate: "Ожидайте следующего обновления (каждые 5 минут)",
                howItWorks: "Как работает система",
                aiAnalysis: "AI Анализ:",
                aiAnalysisDesc: "Используется Llama 4 Maverick для технического анализа",
                realTimeData: "Данные в реальном времени:",
                realTimeDataDesc: "Получение из PocketOption API",
                filtering: "Фильтрация:",
                filteringDesc: "Показываются только сигналы с уверенностью >70%",
                updates: "Обновление:",
                updatesDesc: "Автоматическое обновление каждые 5 минут",
                important: "Важно!",
                disclaimer: "Это учебный проект. Торговля бинарными опционами содержит высокие риски потери средств. Сигналы не являются финансовой рекомендацией.",
                createdWith: "Создано с использованием",
                technologies: "Технологии:",
                confidence: "Уверенность",
                entryTime: "Время входа",
                duration: "Длительность",
                created: "Создано",
                analysis: "Анализ ИИ",
                timezone: "Часовой пояс: Киев (UTC+2)",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да",
                feedbackNo: "Нет",
                feedbackSkip: "Я не проверял"
            }
        };
        this.signalsUrl = 'data/signals.json';
        this.updateInterval = 10000; // 10 секунд
        this.kyivOffset = 2; // UTC+2 для Києва
        this.init();
    }

    async init() {
        this.setupLanguageSwitcher();
        this.setupRefreshButton();
        await this.loadSignals();
        this.startAutoUpdate();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
    }

    setupLanguageSwitcher() {
        // Відновлюємо збережену мову
        const savedLang = localStorage.getItem('preferred_lang') || 'uk';
        this.setLanguage(savedLang);
        
        // Налаштування кнопок
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.setLanguage(lang);
            });
        });
    }

    setupRefreshButton() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.forceRefreshSignals();
            });
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferred_lang', lang);
        
        // Оновлюємо активну кнопку
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        // Оновлюємо переклад
        this.updateTranslations();
        
        // Оновлюємо заголовок сторінки
        document.title = this.translations[lang].title;
        
        // Перезавантажуємо сигнали для нового перекладу
        this.loadSignals();
    }

    updateTranslations() {
        const t = this.translations[this.currentLang];
        
        // Оновлюємо всі елементи з дата-атрибутами
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            if (t[key] !== undefined) {
                el.textContent = t[key];
            }
        });
    }

    async loadSignals(forceRefresh = false) {
        try {
            const container = document.getElementById('signals-container');
            const noSignals = document.getElementById('no-signals');
            
            // Показуємо стан завантаження
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p>${this.translations[this.currentLang].loadingSignals}</p>
                    <small>${this.translations[this.currentLang].autoUpdate}</small>
                </div>
            `;
            noSignals.style.display = 'none';
            
            // Якщо примусове оновлення, додаємо параметр
            const url = forceRefresh ? 
                `${this.signalsUrl}?force=${Date.now()}` : 
                `${this.signalsUrl}?t=${Date.now()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.processSignals(data);
            
        } catch (error) {
            console.error('Помилка завантаження:', error);
            this.showError(this.translations[this.currentLang].loadingSignals + ' ' + error.message);
        }
    }

    processSignals(data) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        
        if (!data || !data.signals || data.signals.length === 0) {
            container.innerHTML = '';
            noSignals.style.display = 'block';
            document.getElementById('active-signals').textContent = '0';
            document.getElementById('total-signals').textContent = '0';
            document.getElementById('success-rate').textContent = '0%';
            return;
        }
        
        noSignals.style.display = 'none';
        
        // Оновлюємо час останнього оновлення
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            const kyivTime = this.convertToKyivTime(updateDate);
            document.getElementById('last-update').textContent = 
                kyivTime.toLocaleString('uk-UA') + ' (Київ)';
            
            // Розрахунок часу з останнього оновлення
            const now = new Date();
            const diffMs = now - updateDate;
            const diffMins = Math.floor(diffMs / 60000);
            const agoElement = document.getElementById('update-ago');
            if (agoElement) {
                if (diffMins < 1) {
                    agoElement.textContent = 'тільки що';
                } else {
                    agoElement.textContent = `${diffMins} хв тому`;
                }
            }
        }
        
        // Фільтруємо сигнали: тільки з confidence > 70% і актуальні
        const now = new Date();
        const validSignals = data.signals.filter(signal => {
            // Перевірка впевненості
            if (signal.confidence < 0.7) return false;
            
            // Перевірка часу входу (має бути в майбутньому або зараз)
            const entryTime = this.parseEntryTime(signal.entry_time, signal.generated_at);
            if (entryTime < now) return false;
            
            // Перевірка тривалості (не більше 5 хвилин)
            if (signal.duration > 5) return false;
            
            return true;
        });

        // Сортуємо по часу входу (найближчі перші)
        validSignals.sort((a, b) => {
            const timeA = this.parseEntryTime(a.entry_time, a.generated_at);
            const timeB = this.parseEntryTime(b.entry_time, b.generated_at);
            return timeA - timeB;
        });

        // Беремо тільки 3 найактуальніші
        this.activeSignals = validSignals.slice(0, 3);
        
        // Оновлюємо кількість активних сигналів
        document.getElementById('active-signals').textContent = this.activeSignals.length;
        document.getElementById('total-signals').textContent = data.signals.length;
        
        // Розрахунок успішності (заглушка - потрібно реалізувати)
        const successRate = this.calculateSuccessRate(data.signals);
        document.getElementById('success-rate').textContent = `${successRate}%`;
        
        this.updateDisplay(this.activeSignals);
        this.startSignalTimers();
    }

    parseEntryTime(timeStr, generatedAt) {
        if (!timeStr) return new Date();
        
        const now = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        let entryTime;
        
        if (generatedAt) {
            // Використовуємо дату з генерації сигналу
            const genDate = new Date(generatedAt);
            entryTime = new Date(genDate);
            entryTime.setHours(hours, minutes, 0, 0);
            
            // Якщо час вже пройшов того ж дня, то це наступний день
            if (entryTime < genDate) {
                entryTime.setDate(entryTime.getDate() + 1);
            }
        } else {
            // Якщо немає дати генерації, використовуємо сьогодні
            entryTime = new Date(now);
            entryTime.setHours(hours, minutes, 0, 0);
            
            // Якщо час вже пройшов сьогодні, це наступний день
            if (entryTime < now) {
                entryTime.setDate(entryTime.getDate() + 1);
            }
        }
        
        return entryTime;
    }

    calculateSuccessRate(signals) {
        // Заглушка - потрібно реалізувати розрахунок на основі історії
        // Поки що використовуємо середню впевненість
        if (signals.length === 0) return 0;
        
        const avgConfidence = signals.reduce((sum, signal) => {
            return sum + (signal.confidence || 0);
        }, 0) / signals.length;
        
        return Math.round(avgConfidence * 100);
    }

    updateDisplay(signals) {
        const container = document.getElementById('signals-container');
        
        if (signals.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const t = this.translations[this.currentLang];
        
        // Генеруємо HTML для сигналів
        let html = '';
        
        signals.forEach((signal, index) => {
            const confidencePercent = Math.round(signal.confidence * 100);
            const confidenceClass = this.getConfidenceClass(confidencePercent);
            const entryTime = signal.entry_time || '--:--';
            const duration = signal.duration || '2';
            
            // Конвертуємо час генерації в Київський
            let generatedTime = 'Не вказано';
            if (signal.generated_at) {
                const genDate = new Date(signal.generated_at);
                generatedTime = this.convertToKyivTime(genDate).toLocaleTimeString('uk-UA', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            html += `
                <div class="signal-card ${signal.direction.toLowerCase()}" id="signal-${index}">
                    <div class="signal-header">
                        <div class="asset-info">
                            <div class="asset-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div>
                                <div class="asset-name">${signal.asset}</div>
                                <small>Таймфрейм: 2 хвилини | Київський час</small>
                            </div>
                        </div>
                        <div class="direction-badge">
                            ${signal.direction === 'UP' ? '📈 CALL' : '📉 PUT'}
                        </div>
                    </div>
                    
                    <div class="signal-details">
                        <div class="detail-item">
                            <div class="label">
                                <i class="fas fa-bullseye"></i> ${t.confidence}
                            </div>
                            <div class="value">
                                ${confidencePercent}%
                                <span class="confidence-badge ${confidenceClass}">
                                    ${confidencePercent >= 85 ? 'Висока' : confidencePercent >= 75 ? 'Середня' : 'Низька'}
                                </span>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="label">
                                <i class="far fa-clock"></i> ${t.entryTime}
                            </div>
                            <div class="value">
                                ${entryTime}
                                <small style="display: block; font-size: 0.8em; color: #666;">(Київ)</small>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="label">
                                <i class="fas fa-hourglass-half"></i> ${t.duration}
                            </div>
                            <div class="value">${duration} хв</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="label">
                                <i class="fas fa-calendar"></i> ${t.created}
                            </div>
                            <div class="value">${generatedTime}</div>
                        </div>
                    </div>
                    
                    <div class="signal-timer" id="timer-${index}" style="display: none;">
                        <div class="timer-display"></div>
                    </div>
                    
                    <div class="signal-feedback" id="feedback-${index}" style="display: none;">
                        <p>${t.feedbackQuestion}</p>
                        <div class="feedback-buttons">
                            <button class="feedback-btn feedback-yes" onclick="handleFeedback('${signal.id || index}', true)">
                                ${t.feedbackYes}
                            </button>
                            <button class="feedback-btn feedback-no" onclick="handleFeedback('${signal.id || index}', false)">
                                ${t.feedbackNo}
                            </button>
                            <button class="feedback-btn feedback-skip" onclick="skipFeedback('${signal.id || index}')">
                                ${t.feedbackSkip}
                            </button>
                        </div>
                    </div>
                    
                    ${signal.reason ? `
                    <div class="signal-reason">
                        <div class="reason-header">
                            <i class="fas fa-lightbulb"></i> ${t.analysis}
                        </div>
                        <div class="reason-text">${signal.reason}</div>
                    </div>
                    ` : ''}
                    
                    <div class="signal-footer">
                        <span><i class="fas fa-globe-europe"></i> ${t.timezone}</span>
                        <span><i class="fas fa-brain"></i> Модель: Llama 4</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    startSignalTimers() {
        // Очищаємо попередні таймери
        Object.values(this.timers).forEach(timer => clearInterval(timer));
        this.timers = {};
        
        this.activeSignals.forEach((signal, index) => {
            const entryTime = this.parseEntryTime(signal.entry_time, signal.generated_at);
            const duration = (signal.duration || 2) * 60000; // в мілісекундах
            const timerElement = document.getElementById(`timer-${index}`);
            const feedbackElement = document.getElementById(`feedback-${index}`);
            
            if (!timerElement) return;
            
            const updateTimer = () => {
                const now = new Date();
                const timeToEntry = entryTime - now;
                
                if (timeToEntry > 0) {
                    // Очікуємо часу входу
                    timerElement.style.display = 'block';
                    const seconds = Math.ceil(timeToEntry / 1000);
                    timerElement.querySelector('.timer-display').textContent = 
                        `До входу: ${seconds} сек`;
                } else if (now - entryTime < duration) {
                    // Угода активна
                    const elapsed = now - entryTime;
                    const remaining = duration - elapsed;
                    timerElement.style.display = 'block';
                    const seconds = Math.ceil(remaining / 1000);
                    timerElement.querySelector('.timer-display').textContent = 
                        `Залишилось: ${seconds} сек`;
                } else {
                    // Угода завершилась
                    timerElement.style.display = 'none';
                    if (feedbackElement) {
                        feedbackElement.style.display = 'block';
                        
                        // Автоматичне приховування питання через 1 хвилину
                        setTimeout(() => {
                            if (feedbackElement.style.display === 'block') {
                                feedbackElement.style.display = 'none';
                                this.handleSignalCompletion(signal.id || index);
                            }
                        }, 60000);
                    }
                }
            };
            
            // Запускаємо таймер
            updateTimer();
            this.timers[index] = setInterval(updateTimer, 1000);
        });
    }

    handleSignalCompletion(signalId) {
        console.log(`Сигнал ${signalId} завершено`);
        // Тут можна додати відправку на сервер або оновлення локальних даних
    }

    getConfidenceClass(percent) {
        if (percent >= 85) return 'confidence-high';
        if (percent >= 75) return 'confidence-medium';
        return 'confidence-low';
    }

    showError(message) {
        const container = document.getElementById('signals-container');
        const t = this.translations[this.currentLang];
        
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${t.error || 'Помилка'}</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="refresh-btn">
                    <i class="fas fa-redo"></i> ${t.tryAgain || 'Спробувати знову'}
                </button>
            </div>
        `;
    }

    convertToKyivTime(date) {
        // Додаємо 2 години для UTC+2 (Київ)
        return new Date(date.getTime() + (this.kyivOffset * 60 * 60 * 1000));
    }

    updateKyivTime() {
        const now = new Date();
        const kyivTime = new Date(now.getTime() + (this.kyivOffset * 60 * 60 * 1000));
        
        const timeElement = document.getElementById('server-time');
        if (timeElement) {
            timeElement.textContent = kyivTime.toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Europe/Kiev'
            });
        }
    }

    startAutoUpdate() {
        setInterval(() => this.loadSignals(), this.updateInterval);
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadSignals();
                this.updateKyivTime();
            }
        });
    }

    async forceRefreshSignals() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('spinning');
            refreshBtn.disabled = true;
        }
        
        try {
            await this.loadSignals(true);
        } finally {
            setTimeout(() => {
                if (refreshBtn) {
                    refreshBtn.classList.remove('spinning');
                    refreshBtn.disabled = false;
                }
            }, 1000);
        }
    }
}

// Глобальні функції для кнопок
function handleFeedback(signalId, isCorrect) {
    console.log(`Feedback for ${signalId}: ${isCorrect ? 'correct' : 'incorrect'}`);
    
    // Тут можна відправити feedback на сервер
    // fetch('/api/feedback', {
    //     method: 'POST',
    //     headers: {'Content-Type': 'application/json'},
    //     body: JSON.stringify({signalId, success: isCorrect})
    // });
    
    const feedbackElement = document.querySelector(`[id^="feedback-"]`);
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }
}

function skipFeedback(signalId) {
    console.log(`Skipped feedback for ${signalId}`);
    const feedbackElement = document.querySelector(`[id^="feedback-"]`);
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }
}

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    window.signalDisplay = new SignalDisplay();
});
