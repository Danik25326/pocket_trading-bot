class SignalDisplay {
    constructor() {
        this.ghConfig = window.GH_CONFIG || {
            owner: 'Danik25326',
            repo: 'pocket_trading_bot',
            branch: 'main',
            baseUrl: 'https://danik25326.github.io/pocket_trading_bot'
        };
        
        this.signalsUrl = `${this.ghConfig.baseUrl}/data/signals.json`;
        this.kyivTZ = 'Europe/Kiev';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.maxSignalsToShow = 6;
        this.feedbackKey = 'signal_feedback_v2';
        
        // Відновлюємо стан кнопки
        this.lastGenerationTime = localStorage.getItem('lastGenerationTime') ? 
            new Date(localStorage.getItem('lastGenerationTime')) : null;
        this.blockUntilTime = localStorage.getItem('blockUntilTime') ?
            new Date(localStorage.getItem('blockUntilTime')) : null;
            
        this.autoRefreshInterval = null;
        this.searchCooldownTimer = null;
        
        this.translations = {
            uk: {
                title: "AI Trading Signals",
                subtitle: "Автоматичні сигнали для бінарних опціонів з використанням GPT OSS 120B AI",
                generationType: "Генерація:",
                manualOnly: "кожні 5 хв (авто)",
                minAccuracy: "Мін. точність:",
                model: "Модель:",
                searchSignalsBtn: "Ручна генерація",
                regenerateBtn: "Оновити",
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
                noSignalsYet: "Сигналів ще немає",
                clickSearchToStart: "Автоматична генерація кожні 5 хвилин",
                noSignalsNow: "Наразі немає актуальних сигналів",
                searchNewSignals: "Автоматична генерація запущена",
                howItWorks: "Як працює система",
                aiAnalysis: "AI Аналіз:",
                aiAnalysisDesc: "GPT OSS 120B для технічного аналізу",
                realTimeData: "Дані в реальному часі:",
                realTimeDataDesc: "Отримання з PocketOption API",
                volatilityBased: "Тривалість угоди:",
                volatilityBasedDesc: "1-5 хв на основі волатильності",
                automaticMode: "Режим:",
                automaticModeDesc: "Автоматична генерація кожні 5 хвилин",
                important: "Важливо!",
                disclaimer: "Торгівля містить високі ризики. Сигнали не є фінансовою рекомендацією.",
                createdWith: "Створено з використанням",
                technologies: "Технології:",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так",
                feedbackNo: "Ні",
                feedbackSkip: "Пропустити",
                timerActive: "Таймер активний:",
                timerExpired: "Час вийшов",
                signalCorrect: "Результат сигналу?",
                replyYes: "Вдало",
                replyNo: "Невдало",
                replySkip: "Пропустити",
                timeLeft: "Залишилось:",
                entryTime: "Час входу:",
                howToStart: "Автоматичний режим",
                instructionText: "Система автоматично генерує сигнали кожні 5 хвилин. Можна запустити додаткову ручну генерацію.",
                generatingSignals: "Генерація сигналів...",
                updateIn: "Оновлення через:",
                minutes: "хв",
                seconds: "сек",
                signalGenerated: "Сигнал згенеровано",
                searchInProgress: "Запуск генерації...",
                waitForCompletion: "Зачекайте завершення",
                generatingViaAPI: "Запуск генерації...",
                waitMinutes: 'Зачекайте ще',
                minutesLeft: 'хвилин',
                signalGenerationStarted: 'Генерація сигналів запущена!',
                generationFailed: 'Не вдалося запустити генерацію',
                cooldownActive: 'Зачекайте 5 хвилин перед наступною генерацією',
                noTokenConfigured: 'GitHub токен не налаштовано',
                nextAutoUpdate: 'Наступна авто-генерація:',
                signalsLimit: 'Ліміт сигналів:',
                answeredSignals: 'Відповіді на сигнали:',
                showHistory: 'Показати історію',
                hideHistory: 'Сховати історію'
            },
            ru: {
                title: "AI Торговые Сигналы",
                subtitle: "Автоматические сигналы для бинарных опционов с использованием GPT OSS 120B AI",
                generationType: "Генерация:",
                manualOnly: "каждые 5 мин (авто)",
                minAccuracy: "Мин. точность:",
                model: "Модель:",
                searchSignalsBtn: "Ручная генерация",
                regenerateBtn: "Обновить",
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
                noSignalsYet: "Сигналов еще нет",
                clickSearchToStart: "Автоматическая генерация каждые 5 минут",
                noSignalsNow: "В настоящее время нет актуальных сигналов",
                searchNewSignals: "Автоматическая генерация запущена",
                howItWorks: "Как работает система",
                aiAnalysis: "AI Анализ:",
                aiAnalysisDesc: "GPT OSS 120B для технического анализа",
                realTimeData: "Данные в реальном времени:",
                realTimeDataDesc: "Получение из PocketOption API",
                volatilityBased: "Длительность сделки:",
                volatilityBasedDesc: "1-5 мин на основе волатильности",
                automaticMode: "Режим:",
                automaticModeDesc: "Автоматическая генерация каждые 5 минут",
                important: "Важно!",
                disclaimer: "Торговля содержит высокие риски. Сигналы не являются финансовой рекомендацией.",
                createdWith: "Создано с использованием",
                technologies: "Технологии:",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да",
                feedbackNo: "Нет",
                feedbackSkip: "Пропустить",
                timerActive: "Таймер активен:",
                timerExpired: "Время вышло",
                signalCorrect: "Результат сигнала?",
                replyYes: "Удачно",
                replyNo: "Неудачно",
                replySkip: "Пропустить",
                timeLeft: "Осталось:",
                entryTime: "Время входа:",
                howToStart: "Автоматический режим",
                instructionText: "Система автоматически генерирует сигналы каждые 5 минут. Можно запустить дополнительную ручную генерацию.",
                generatingSignals: "Генерация сигналов...",
                updateIn: "Обновление через:",
                minutes: "мин",
                seconds: "сек",
                signalGenerated: "Сигнал сгенерирован",
                searchInProgress: "Запуск генерации...",
                waitForCompletion: "Дождитесь завершения",
                generatingViaAPI: "Запуск генерации...",
                waitMinutes: 'Подождите еще',
                minutesLeft: 'минут',
                signalGenerationStarted: 'Генерация сигналов запущена!',
                generationFailed: 'Не удалось запустить генерацию',
                cooldownActive: 'Подождите 5 минут перед следующей генерацией',
                noTokenConfigured: 'GitHub токен не настроен',
                nextAutoUpdate: 'Следующая авто-генерация:',
                signalsLimit: 'Лимит сигналов:',
                answeredSignals: 'Ответы на сигналы:',
                showHistory: 'Показать историю',
                hideHistory: 'Скрыть историю'
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.setupEventListeners();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Відновлюємо блокування кнопки
        this.restoreButtonBlockState();
        
        await this.loadSignals();
        this.startAutoRefresh();
        
        // Додаємо лічильник до наступної автоматичної генерації
        this.updateNextAutoGenerationTimer();
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('search-signals-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.startSignalGeneration();
            });
        }
        
        document.getElementById('lang-uk')?.addEventListener('click', () => {
            this.switchLanguage('uk');
        });
        
        document.getElementById('lang-ru')?.addEventListener('click', () => {
            this.switchLanguage('ru');
        });
        
        // Додаємо обробку кнопки оновлення
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.loadSignals(true);
                this.showMessage('success', '✅ Дані оновлено');
            });
        }
    }

    restoreButtonBlockState() {
        if (this.blockUntilTime) {
            const now = new Date();
            const timeLeft = Math.max(0, this.blockUntilTime - now);
            
            if (timeLeft > 0) {
                const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
                this.disableSearchButton(minutesLeft);
            } else {
                localStorage.removeItem('blockUntilTime');
                this.blockUntilTime = null;
            }
        }
    }

    async startSignalGeneration() {
        const btn = document.getElementById('search-signals-btn');
        if (!btn) return;
        
        const now = new Date();
        if (this.blockUntilTime && now < this.blockUntilTime) {
            const timeLeft = Math.ceil((this.blockUntilTime - now) / (1000 * 60));
            this.showMessage('warning', 
                `${this.translate('cooldownActive')} (${timeLeft} ${this.translate('minutesLeft')})`);
            return;
        }
        
        const originalText = btn.innerHTML;
        
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.translate('searchInProgress')}`;
        btn.disabled = true;
        
        this.showMessage('info', 
            '🚀 Запускаємо додаткову ручну генерацію сигналів...<br>' +
            '⏳ Сигнали з\'являться через 30-60 секунд<br>' +
            '<small>Під час генерації кнопка буде неактивна</small>');
        
        this.lastGenerationTime = new Date();
        this.blockUntilTime = new Date(now.getTime() + 5 * 60 * 1000);
        
        localStorage.setItem('lastGenerationTime', this.lastGenerationTime.toISOString());
        localStorage.setItem('blockUntilTime', this.blockUntilTime.toISOString());
        
        this.disableSearchButton(5);
        
        // Запускаємо GitHub Actions workflow
        await this.triggerGitHubAction();
        
        // Оновлюємо сигнали через 45 секунд
        setTimeout(async () => {
            await this.loadSignals(true);
            this.showMessage('success', 
                '✅ Сигнали успішно згенеровано!<br>' +
                '<small>Дані оновлено на сторінці</small>');
        }, 45000);
        
        // Додаткове оновлення через 60 секунд
        setTimeout(async () => {
            await this.loadSignals(true);
        }, 60000);
    }

    async triggerGitHubAction() {
        try {
            const token = this.ghConfig.token;
            if (!token) {
                console.warn('GitHub токен не налаштовано');
                return;
            }
            
            const response = await fetch(
                `https://api.github.com/repos/${this.ghConfig.owner}/${this.ghConfig.repo}/dispatches`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_type: 'manual_generation',
                        client_payload: {
                            language: this.language,
                            trigger_source: 'manual_from_website'
                        }
                    })
                }
            );
            
            if (response.ok) {
                console.log('✅ GitHub Action запущено');
            } else {
                console.error('❌ Помилка запуску GitHub Action:', await response.text());
            }
        } catch (error) {
            console.error('❌ Помилка:', error);
        }
    }

    disableSearchButton(minutes) {
        const btn = document.getElementById('search-signals-btn');
        if (!btn) return;
        
        const endTime = this.blockUntilTime || new Date(new Date().getTime() + minutes * 60 * 1000);
        
        const updateButton = () => {
            const now = new Date();
            const timeLeft = Math.max(0, endTime - now);
            
            if (timeLeft <= 0) {
                btn.innerHTML = `<i class="fas fa-search"></i> <span class="btn-text">${this.translate('searchSignalsBtn')}</span>`;
                btn.disabled = false;
                clearInterval(this.searchCooldownTimer);
                
                localStorage.removeItem('blockUntilTime');
                this.blockUntilTime = null;
                return;
            }
            
            const minutesLeft = Math.floor(timeLeft / (1000 * 60));
            const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            btn.innerHTML = `
                <i class="fas fa-clock"></i> 
                ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}
                <span class="btn-text" style="display:none">${this.translate('searchSignalsBtn')}</span>
            `;
        };
        
        if (this.searchCooldownTimer) {
            clearInterval(this.searchCooldownTimer);
        }
        
        this.searchCooldownTimer = setInterval(updateButton, 1000);
        updateButton();
    }

    async loadSignals(force = false) {
        try {
            const timestamp = new Date().getTime();
            const cacheBuster = force ? `?t=${timestamp}` : `?nocache=${timestamp}`;
            
            const response = await fetch(`${this.signalsUrl}${cacheBuster}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.processSignals(data, force);
            
            this.updateStats(data);
            
        } catch (error) {
            console.error('Помилка завантаження сигналів:', error);
            
            const lastUpdate = document.getElementById('last-update');
            if (lastUpdate) {
                const now = new Date();
                lastUpdate.textContent = now.toLocaleTimeString('uk-UA', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) + ' (помилка)';
            }
        }
    }

    processSignals(data, force = false) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        const lastUpdate = document.getElementById('last-update');
        const activeSignalsElement = document.getElementById('active-signals');
        const totalSignalsElement = document.getElementById('total-signals');
        
        if (!data || !data.signals || data.signals.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            if (lastUpdate) lastUpdate.textContent = '--:--:--';
            if (activeSignalsElement) activeSignalsElement.textContent = '0';
            if (totalSignalsElement) totalSignalsElement.textContent = '0';
            if (noSignals) noSignals.style.display = 'block';
            return;
        }
        
        if (data.last_update && lastUpdate) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        if (activeSignalsElement) {
            activeSignalsElement.textContent = data.active_signals || 0;
        }
        
        if (totalSignalsElement) {
            totalSignalsElement.textContent = data.total_signals || data.signals.length;
        }
        
        // Отримуємо фідбек з localStorage
        const feedback = this.getFeedback();
        const answeredSignalIds = new Set(feedback.map(f => f.signal_id));
        
        // Фільтруємо сигнали, на які ще не відповіли
        const activeSignals = data.signals.filter(signal => 
            !answeredSignalIds.has(signal.id)
        );
        
        // Обмежуємо кількість сигналів для відображення
        const signalsToShow = activeSignals.slice(0, this.maxSignalsToShow);
        
        if (signalsToShow.length === 0) {
            container.innerHTML = this.getNoSignalsHTML();
            if (noSignals) noSignals.style.display = 'block';
        } else {
            let html = '';
            
            signalsToShow.forEach((signal, index) => {
                const confidencePercent = Math.round(signal.confidence * 100);
                if (confidencePercent < 70) return;
                
                const signalId = `signal-${signal.id || index}`;
                const signalHTML = this.createSignalHTML(signal, signalId);
                
                if (signalHTML) {
                    html += signalHTML;
                }
            });
            
            if (html === '') {
                container.innerHTML = this.getNoSignalsHTML();
                if (noSignals) noSignals.style.display = 'block';
            } else {
                container.innerHTML = html;
                if (noSignals) noSignals.style.display = 'none';
                
                // Налаштовуємо таймери для кожного сигналу
                signalsToShow.forEach((signal, index) => {
                    const signalId = `signal-${signal.id || index}`;
                    this.setupSignalTimer(signal, signalId);
                });
            }
        }
        
        // Оновлюємо статистику фідбеку
        this.updateFeedbackStats(feedback.length);
    }

    createSignalHTML(signal, signalId) {
        const confidencePercent = Math.round(signal.confidence * 100);
        const confidenceClass = this.getConfidenceClass(confidencePercent);
        const directionClass = signal.direction.toLowerCase();
        const duration = signal.duration || 2;
        
        const entryTimeKyiv = this.convertToKyivTime(signal.entry_time || signal.timestamp);
        const generatedTime = this.convertToKyivTime(signal.generated_at);
        
        let reason = signal.reason || '';
        if (this.language === 'ru' && signal.reason_ru) {
            reason = signal.reason_ru;
        }
        
        return `
            <div class="signal-card ${directionClass}" id="${signalId}" data-signal-id="${signal.id}" data-asset="${signal.asset}" data-entry-time="${entryTimeKyiv}">
                <div class="signal-header">
                    <div class="asset-info">
                        <div class="asset-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div>
                            <div class="asset-name">${signal.asset}</div>
                            <small>Тривалість: ${duration} хв | Київський час</small>
                        </div>
                    </div>
                    <div class="direction-badge">
                        ${signal.direction === 'UP' ? '📈 CALL' : '📉 PUT'}
                    </div>
                </div>
                
                <div class="signal-details">
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-bullseye"></i> Впевненість
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
                            <i class="far fa-clock"></i> ${this.translate('entryTime')}
                        </div>
                        <div class="value">
                            ${entryTimeKyiv}
                            <small style="display: block; font-size: 0.8em; color: #666;">(через ${signal.entry_delay_minutes || 2} хв)</small>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-hourglass-half"></i> Тривалість
                        </div>
                        <div class="value">${duration} хв</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-calendar"></i> Створено
                        </div>
                        <div class="value">${generatedTime}</div>
                    </div>
                </div>
                
                <div class="signal-timer-container" id="timer-${signalId}">
                    <!-- Таймер буде додано JavaScript -->
                </div>
                
                ${reason ? `
                <div class="signal-reason">
                    <div class="reason-header">
                        <i class="fas fa-lightbulb"></i> Аналіз AI
                    </div>
                    <div class="reason-text">${reason}</div>
                </div>
                ` : ''}
                
                <div class="signal-feedback" id="feedback-${signalId}" style="display: none;">
                    <p>${this.translate('signalCorrect')}</p>
                    <div class="feedback-buttons">
                        <button class="feedback-btn feedback-yes" onclick="signalDisplay.saveFeedback('${signal.id}', 'yes')">
                            ${this.translate('feedbackYes')}
                        </button>
                        <button class="feedback-btn feedback-no" onclick="signalDisplay.saveFeedback('${signal.id}', 'no')">
                            ${this.translate('feedbackNo')}
                        </button>
                        <button class="feedback-btn feedback-skip" onclick="signalDisplay.saveFeedback('${signal.id}', 'skip')">
                            ${this.translate('feedbackSkip')}
                        </button>
                    </div>
                </div>
                
                <div class="signal-footer">
                    <span><i class="fas fa-globe-europe"></i> Часова зона: Київ (UTC+2)</span>
                    <span><i class="fas fa-brain"></i> Модель: GPT OSS 120B</span>
                </div>
            </div>
        `;
    }

    setupSignalTimer(signal, signalId) {
        const container = document.getElementById(`timer-${signalId}`);
        const feedbackContainer = document.getElementById(`feedback-${signalId}`);
        if (!container) return;
        
        const entryTime = signal.entry_time || signal.timestamp;
        const duration = parseFloat(signal.duration) || 2;
        
        if (!entryTime) return;
        
        // Парсимо час входу
        const now = new Date();
        const [hours, minutes] = entryTime.split(':').map(Number);
        let entryDate = new Date();
        entryDate.setHours(hours, minutes, 0, 0);
        
        // Якщо час входу вже минув сьогодні, встановлюємо на завтра
        if (entryDate < now) {
            entryDate.setDate(entryDate.getDate() + 1);
        }
        
        const endDate = new Date(entryDate.getTime() + duration * 60000);
        
        const updateTimerDisplay = () => {
            const now = new Date();
            const timeToEntry = entryDate - now;
            const timeLeft = endDate - now;
            
            if (timeToEntry > 0) {
                // Чекаємо на час входу
                const minutesToEntry = Math.floor(timeToEntry / 60000);
                const secondsToEntry = Math.floor((timeToEntry % 60000) / 1000);
                
                container.innerHTML = `
                    <div class="signal-timer waiting">
                        <div class="timer-display">
                            <i class="fas fa-clock"></i> 
                            <span class="timer-text">${minutesToEntry}:${secondsToEntry.toString().padStart(2, '0')}</span>
                        </div>
                        <small>${this.translate('timerActive')} (до входу)</small>
                    </div>
                `;
                
                container.style.display = 'block';
                if (feedbackContainer) feedbackContainer.style.display = 'none';
                
            } else if (timeLeft > 0) {
                // Сигнал активний
                const minutesLeft = Math.floor(timeLeft / 60000);
                const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
                
                container.innerHTML = `
                    <div class="signal-timer active">
                        <div class="timer-display">
                            <i class="fas fa-hourglass-half"></i> 
                            <span class="timer-text">${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}</span>
                        </div>
                        <small>${this.translate('timerActive')}</small>
                    </div>
                `;
                
                container.style.display = 'block';
                if (feedbackContainer) feedbackContainer.style.display = 'none';
                
            } else {
                // Час вийшов - показуємо фідбек
                container.style.display = 'none';
                if (feedbackContainer) {
                    feedbackContainer.style.display = 'block';
                    
                    // Видаляємо старий таймер
                    const timer = this.activeTimers.get(signalId);
                    if (timer && timer.updateInterval) {
                        clearInterval(timer.updateInterval);
                    }
                    this.activeTimers.delete(signalId);
                }
                return;
            }
            
            // Зберігаємо таймер
            this.activeTimers.set(signalId, {
                isActive: true,
                endTime: endDate.getTime(),
                updateInterval: setInterval(() => updateTimerDisplay(), 1000)
            });
        };
        
        updateTimerDisplay();
    }

    saveFeedback(signalId, feedback) {
        const existing = this.getFeedback();
        
        existing.push({
            signal_id: signalId,
            feedback: feedback,
            timestamp: new Date().toISOString(),
            language: this.language
        });
        
        localStorage.setItem(this.feedbackKey, JSON.stringify(existing));
        
        // Приховуємо сигнал
        const signalElement = document.querySelector(`[data-signal-id="${signalId}"]`);
        if (signalElement) {
            signalElement.remove();
        }
        
        // Видаляємо таймер
        const timer = this.activeTimers.get(`signal-${signalId}`);
        if (timer && timer.updateInterval) {
            clearInterval(timer.updateInterval);
        }
        this.activeTimers.delete(`signal-${signalId}`);
        
        this.updateSignalCount();
        this.updateFeedbackStats(existing.length);
        
        this.showMessage('success', '✅ Відповідь збережено!');
    }

    getFeedback() {
        const feedback = localStorage.getItem(this.feedbackKey);
        return feedback ? JSON.parse(feedback) : [];
    }

    updateFeedbackStats(feedbackCount) {
        // Оновлюємо статистику в інтерфейсі
        const feedbackStats = document.getElementById('feedback-stats');
        if (!feedbackStats) {
            // Створюємо елемент, якщо його немає
            const statsGrid = document.querySelector('.stats-grid');
            if (statsGrid) {
                const feedbackCard = document.createElement('div');
                feedbackCard.className = 'stat-card info';
                feedbackCard.id = 'feedback-stats';
                feedbackCard.innerHTML = `
                    <div class="stat-icon">
                        <i class="fas fa-comment-dots"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${this.translate('answeredSignals')}</h3>
                        <p class="stat-value">${feedbackCount}</p>
                        <small>${this.translate('feedbackGiven')}</small>
                    </div>
                `;
                statsGrid.appendChild(feedbackCard);
            }
        } else {
            const statValue = feedbackStats.querySelector('.stat-value');
            if (statValue) {
                statValue.textContent = feedbackCount;
            }
        }
    }

    updateSignalCount() {
        const container = document.getElementById('signals-container');
        const visibleSignals = container.querySelectorAll('.signal-card').length;
        const activeSignalsElement = document.getElementById('active-signals');
        if (activeSignalsElement) {
            activeSignalsElement.textContent = visibleSignals;
        }
        
        const noSignals = document.getElementById('no-signals');
        if (visibleSignals === 0 && noSignals) {
            noSignals.style.display = 'block';
        }
    }

    updateStats(data) {
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate && data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        const activeSignalsElement = document.getElementById('active-signals');
        if (activeSignalsElement) {
            activeSignalsElement.textContent = data.active_signals || '0';
        }
        
        const totalSignalsElement = document.getElementById('total-signals');
        if (totalSignalsElement) {
            totalSignalsElement.textContent = data.total_signals || '0';
        }
    }

    updateKyivTime() {
        const now = new Date();
        const timeElement = document.getElementById('server-time');
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('uk-UA', {
                timeZone: this.kyivTZ,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    updateNextAutoGenerationTimer() {
        // Розраховуємо час до наступної автоматичної генерації (кожні 5 хвилин)
        const now = new Date();
        const nextUpdate = new Date(Math.ceil(now.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000));
        const timeToNext = nextUpdate - now;
        
        const updateTimer = () => {
            const now = new Date();
            const timeLeft = nextUpdate - now;
            
            if (timeLeft <= 0) {
                // Запускаємо оновлення
                this.loadSignals(true);
                // Перераховуємо наступне оновлення
                this.updateNextAutoGenerationTimer();
                return;
            }
            
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            // Оновлюємо інформаційну картку
            const infoCard = document.querySelector('.action-info-card .info-content p');
            if (infoCard) {
                infoCard.innerHTML = `
                    ${this.translate('instructionText')}
                    <br><br>
                    <strong>${this.translate('nextAutoUpdate')} ${minutes}:${seconds.toString().padStart(2, '0')}</strong>
                `;
            }
        };
        
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    convertToKyivTime(dateString) {
        if (!dateString) return '--:--';
        
        const date = new Date(dateString);
        return date.toLocaleTimeString('uk-UA', {
            timeZone: this.kyivTZ,
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(date, includeSeconds = false) {
        return date.toLocaleTimeString('uk-UA', {
            timeZone: this.kyivTZ,
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

    getEmptyStateHTML() {
        return `
            <div class="loading-state">
                <div class="spinner">
                    <i class="fas fa-search"></i>
                </div>
                <p>${this.translate('noSignalsYet')}</p>
                <small>${this.translate('clickSearchToStart')}</small>
            </div>
        `;
    }

    getNoSignalsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>${this.translate('noSignalsNow')}</h3>
                <p>${this.translate('searchNewSignals')}</p>
            </div>
        `;
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(async () => {
            await this.loadSignals();
        }, 30000);
        
        console.log('🔄 Автоматичне оновлення даних кожні 30 секунд');
    }

    showMessage(type, html) {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.style.cssText = `
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        message.innerHTML = html;
        
        messageContainer.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 5000);
    }

    async setupLanguage() {
        this.applyLanguage(this.language);
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.language);
        });
    }

    switchLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage(lang);
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        this.loadSignals();
    }

    applyLanguage(lang) {
        const translations = this.translations[lang];
        if (!translations) return;
        
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[key];
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

// Додаємо CSS для анімацій
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .message {
        font-size: 14px;
        line-height: 1.5;
    }
    
    .message small {
        opacity: 0.9;
        font-size: 12px;
    }
    
    .signal-timer.waiting {
        background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
        border-left: 4px solid #1890ff;
    }
    
    .signal-timer.active {
        background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
        border-left: 4px solid #52c41a;
    }
    
    .signal-timer.waiting .timer-display {
        color: #1890ff;
    }
    
    .signal-timer.active .timer-display {
        color: #52c41a;
    }
`;
document.head.appendChild(style);

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    window.signalDisplay = new SignalDisplay();
});
