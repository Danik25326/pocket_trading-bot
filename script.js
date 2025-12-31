class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.historyUrl = 'data/history.json';
        this.kyivTZ = 'Europe/Kiev';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.lastGenerationTime = localStorage.getItem('lastGenerationTime') ? new Date(localStorage.getItem('lastGenerationTime')) : null;
        this.refreshTimer = null;
        this.searchCooldownTimer = null;
        this.ghConfig = window.GH_CONFIG || {
            owner: 'Danik25326',
            repo: 'pocket_trading_bot',
            workflowId: 'signals.yml',
            token: '{{GH_PAT}}'
        };
        
        this.translations = {
            uk: {
                title: "AI Trading Signals",
                subtitle: "Автоматичні сигнали для бінарних опціонів з використанням GPT OSS 120B AI",
                generationType: "Генерація:",
                manualOnly: "тільки вручну",
                minAccuracy: "Мін. точність:",
                model: "Модель:",
                searchSignalsBtn: "Пошук сигналів",
                regenerateBtn: "Перегенерувати",
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
                clickSearchToStart: "Натисніть 'Пошук сигналів' для початку",
                noSignalsNow: "Наразі немає актуальних сигналів",
                searchNewSignals: "Знайдіть нові сигнали або зачекайте завершення поточних",
                howItWorks: "Як працює система",
                aiAnalysis: "AI Аналіз:",
                aiAnalysisDesc: "GPT OSS 120B для технічного аналізу",
                realTimeData: "Дані в реальному часі:",
                realTimeDataDesc: "Отримання з PocketOption API",
                volatilityBased: "Тривалість угоди:",
                volatilityBasedDesc: "1-5 хв на основі волатильності",
                manualControl: "Контроль:",
                manualControlDesc: "Тільки ручна генерація сигналів",
                important: "Важливо!",
                disclaimer: "Торгівля містить високі ризики. Сигнали не є фінансовою рекомендацією.",
                createdWith: "Створено з використанням",
                technologies: "Технології:",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так",
                feedbackNo: "Ні",
                feedbackSkip: "Я не перевіряв",
                timerActive: "Таймер активний:",
                timerExpired: "Час вийшов",
                signalCorrect: "Сигнал вірний?",
                replyYes: "Так",
                replyNo: "Ні",
                replySkip: "Пропустити",
                timeLeft: "Залишилось:",
                entryTime: "Час входу:",
                howToStart: "Як почати роботу?",
                instructionText: "Натисніть кнопку 'Пошук сигналів' для генерації нових сигналів. Після генерації ви зможете перегенерувати сигнали через 5 хвилин.",
                generatingSignals: "Генерація сигналів...",
                updateIn: "Оновлення через:",
                minutes: "хв",
                seconds: "сек",
                signalGenerated: "Сигнал згенеровано",
                searchInProgress: "Пошук сигналів...",
                waitForCompletion: "Зачекайте завершення",
                generatingViaAPI: "Запуск генерації через API...",
                waitMinutes: 'Зачекайте ще',
                minutesLeft: 'хвилин',
                signalGenerationStarted: 'Генерація сигналів запущена!',
                generationFailed: 'Не вдалося запустити генерацію',
                cooldownActive: 'Зачекайте 5 хвилин перед наступною генерацією',
                noTokenConfigured: 'GitHub токен не налаштовано. Перевірте config.js'
            },
            ru: {
                title: "AI Торговые Сигналы",
                subtitle: "Автоматические сигналы для бинарных опционов с использованием GPT OSS 120B AI",
                generationType: "Генерация:",
                manualOnly: "только вручную",
                minAccuracy: "Мин. точность:",
                model: "Модель:",
                searchSignalsBtn: "Поиск сигналов",
                regenerateBtn: "Перегенерировать",
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
                clickSearchToStart: "Нажмите 'Поиск сигналов' для начала",
                noSignalsNow: "В настоящее время нет актуальных сигналов",
                searchNewSignals: "Найдите новые сигналы или дождитесь завершения текущих",
                howItWorks: "Как работает система",
                aiAnalysis: "AI Анализ:",
                aiAnalysisDesc: "GPT OSS 120B для технического анализа",
                realTimeData: "Данные в реальном времени:",
                realTimeDataDesc: "Получение из PocketOption API",
                volatilityBased: "Длительность сделки:",
                volatilityBasedDesc: "1-5 мин на основе волатильности",
                manualControl: "Контроль:",
                manualControlDesc: "Только ручная генерация сигналов",
                important: "Важно!",
                disclaimer: "Торговля содержит высокие риски. Сигналы не являются финансовой рекомендацией.",
                createdWith: "Создано с использованием",
                technologies: "Технологии:",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да",
                feedbackNo: "Нет",
                feedbackSkip: "Я не проверял",
                timerActive: "Таймер активен:",
                timerExpired: "Время вышло",
                signalCorrect: "Сигнал верный?",
                replyYes: "Да",
                replyNo: "Нет",
                replySkip: "Пропустить",
                timeLeft: "Осталось:",
                entryTime: "Время входа:",
                howToStart: "Как начать работу?",
                instructionText: "Нажмите кнопку 'Поиск сигналов' для генерации новых сигналов. После генерации вы сможете перегенерировать сигналы через 5 минут.",
                generatingSignals: "Генерация сигналов...",
                updateIn: "Обновление через:",
                minutes: "мин",
                seconds: "сек",
                signalGenerated: "Сигнал сгенерирован",
                searchInProgress: "Поиск сигналов...",
                waitForCompletion: "Дождитесь завершения",
                generatingViaAPI: "Запуск генерации через API...",
                waitMinutes: 'Подождите еще',
                minutesLeft: 'минут',
                signalGenerationStarted: 'Генерация сигналов запущена!',
                generationFailed: 'Не удалось запустить генерацию',
                cooldownActive: 'Подождите 5 минут перед следующей генерацией',
                noTokenConfigured: 'GitHub токен не настроен. Проверьте config.js'
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.setupEventListeners();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        this.checkGenerationTime();
        await this.loadSignals();
        this.startTimerChecks();
    }

    setupEventListeners() {
        document.getElementById('search-signals-btn').addEventListener('click', () => {
            this.startSignalGeneration();
        });
        
        document.getElementById('lang-uk').addEventListener('click', () => {
            this.switchLanguage('uk');
        });
        
        document.getElementById('lang-ru').addEventListener('click', () => {
            this.switchLanguage('ru');
        });
    }

    async startSignalGeneration() {
        const btn = document.getElementById('search-signals-btn');
        const originalText = btn.innerHTML;
        
        // Перевірка 5-хвилинного інтервалу
        const now = new Date();
        if (this.lastGenerationTime) {
            const diffMs = now - this.lastGenerationTime;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            if (diffMinutes < 5) {
                const minutesLeft = 5 - diffMinutes;
                this.showMessage('warning', 
                    `${this.translate('cooldownActive')} (${minutesLeft} ${this.translate('minutesLeft')})`);
                return;
            }
        }
        
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.translate('generatingViaAPI')}`;
        btn.disabled = true;
        
        try {
            // Запускаємо workflow
            const success = await this.triggerGitHubWorkflow();
            
            if (success) {
                // Зберігаємо час запуску
                this.lastGenerationTime = new Date();
                localStorage.setItem('lastGenerationTime', this.lastGenerationTime.toISOString());
                
                // Блокуємо кнопку на 5 хвилин
                this.disableSearchButton(5);
                
                // Показуємо повідомлення про успіх
                this.showMessage('success', 
                    '🚀 Генерація сигналів запущена!<br>' +
                    '<small>Сигнали з\'являться через 30-60 секунд</small>');
                
                // Оновлюємо сигнали через 30 секунд (час на генерацію)
                setTimeout(async () => {
                    await this.loadSignals(true);
                    btn.innerHTML = originalText;
                    this.showMessage('info', 'Сигнали оновлено!');
                }, 30000);
                
            } else {
                throw new Error('Failed to trigger workflow');
            }
        } catch (error) {
            console.error('Помилка генерації:', error);
            this.showMessage('error', this.translate('generationFailed'));
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async triggerGitHubWorkflow() {
        // Перевірка наявності токена
        if (!this.ghConfig.token || this.ghConfig.token.includes('ваш_реальний')) {
            console.error('GitHub token not configured');
            this.showMessage('error', 
                'GitHub токен не налаштовано. Будь ласка, додайте токен у файл config.js<br>' +
                '<small>Створіть PAT токен у GitHub з правами repo та workflow</small>');
            return false;
        }

        const url = `https://api.github.com/repos/${this.ghConfig.owner}/${this.ghConfig.repo}/actions/workflows/${this.ghConfig.workflowId}/dispatches`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.ghConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: {
                        language: this.language,
                        trigger_source: 'website_button'
                    }
                })
            });
            
            if (response.status === 204) {
                console.log('✅ Workflow triggered successfully');
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to trigger workflow:', response.status, errorText);
                
                if (response.status === 401 || response.status === 403) {
                    this.showMessage('error', 
                        'Помилка авторизації. Перевірте ваш токен:<br>' +
                        '1. Чи активний токен?<br>' +
                        '2. Чи має права repo та workflow?<br>' +
                        '3. Чи правильний токен у config.js?');
                } else {
                    this.showMessage('error', `Помилка GitHub API: ${response.status}`);
                }
                return false;
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            this.showMessage('error', 'Мережева помилка. Перевірте підключення до інтернету');
            return false;
        }
    }

    async checkWorkflowStatus() {
        // Це опціональний метод для перевірки статусу workflow
        const url = `https://api.github.com/repos/${this.ghConfig.owner}/${this.ghConfig.repo}/actions/runs`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.ghConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const latestRun = data.workflow_runs[0];
                
                if (latestRun) {
                    console.log(`Workflow status: ${latestRun.status}, conclusion: ${latestRun.conclusion}`);
                    return latestRun;
                }
            }
        } catch (error) {
            console.error('Error checking workflow status:', error);
        }
        return null;
    }

    disableSearchButton(minutes) {
        const btn = document.getElementById('search-signals-btn');
        let timeLeft = minutes * 60;
        
        btn.disabled = true;
        
        const updateButton = () => {
            const minutesLeft = Math.floor(timeLeft / 60);
            const secondsLeft = timeLeft % 60;
            
            btn.innerHTML = `<i class="fas fa-clock"></i> ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                btn.innerHTML = `<i class="fas fa-search"></i> <span class="btn-text">${this.translate('searchSignalsBtn')}</span>`;
                btn.disabled = false;
                clearInterval(this.searchCooldownTimer);
            } else {
                timeLeft--;
            }
        };
        
        if (this.searchCooldownTimer) {
            clearInterval(this.searchCooldownTimer);
        }
        
        this.searchCooldownTimer = setInterval(updateButton, 1000);
        updateButton();
    }

    checkGenerationTime() {
        if (this.lastGenerationTime) {
            const now = new Date();
            const diffMs = now - this.lastGenerationTime;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            if (diffMinutes < 5) {
                const minutesLeft = 5 - diffMinutes;
                this.disableSearchButton(minutesLeft);
            }
        }
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
            this.showError(this.translate('noSignalsYet'));
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
            lastUpdate.textContent = '--:--:--';
            activeSignalsElement.textContent = '0';
            totalSignalsElement.textContent = '0';
            return;
        }
        
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        activeSignalsElement.textContent = data.active_signals || 0;
        totalSignalsElement.textContent = data.total_signals || data.signals.length;
        
        let html = '';
        let hasActiveSignals = false;
        
        data.signals.forEach((signal, index) => {
            const confidencePercent = Math.round(signal.confidence * 100);
            if (confidencePercent < 70) return;
            
            const signalId = `signal-${index}`;
            const signalHTML = this.createSignalHTML(signal, signalId);
            
            if (signalHTML) {
                html += signalHTML;
                hasActiveSignals = true;
            }
        });
        
        if (!hasActiveSignals) {
            container.innerHTML = this.getNoSignalsHTML();
            noSignals.style.display = 'block';
        } else {
            container.innerHTML = html;
            noSignals.style.display = 'none';
            
            data.signals.forEach((signal, index) => {
                const signalId = `signal-${index}`;
                this.setupSignalTimer(signal, signalId);
            });
        }
    }

    createSignalHTML(signal, signalId) {
        const confidencePercent = Math.round(signal.confidence * 100);
        const confidenceClass = this.getConfidenceClass(confidencePercent);
        const directionClass = signal.direction.toLowerCase();
        const duration = signal.duration || 2;
        
        const entryTimeKyiv = this.convertToKyivTime(signal.entry_timestamp || signal.timestamp);
        const generatedTime = this.convertToKyivTime(signal.generated_at);
        
        let reason = signal.reason || '';
        if (this.language === 'ru' && signal.reason_ru) {
            reason = signal.reason_ru;
        }
        
        return `
            <div class="signal-card ${directionClass}" id="${signalId}" data-asset="${signal.asset}" data-entry-time="${entryTimeKyiv}">
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
                            <i class="fas fa-bullseye"></i> ${this.translate('withConfidence').replace('з ', '')}
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
                            <small style="display: block; font-size: 0.8em; color: #666;">(Київ)</small>
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
                
                <div class="signal-footer">
                    <span><i class="fas fa-globe-europe"></i> Часова зона: Київ (UTC+2)</span>
                    <span><i class="fas fa-brain"></i> Модель: GPT OSS 120B</span>
                </div>
            </div>
        `;
    }

    setupSignalTimer(signal, signalId) {
        const container = document.getElementById(`timer-${signalId}`);
        if (!container) return;
        
        const entryTime = signal.entry_timestamp || signal.timestamp;
        const duration = parseFloat(signal.duration) || 2;
        
        if (!entryTime) return;
        
        const entryDate = new Date(entryTime);
        const endDate = new Date(entryDate.getTime() + duration * 60000);
        
        const updateTimerDisplay = () => {
            const now = new Date();
            const timeLeft = endDate - now;
            
            if (timeLeft > 0) {
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
                
                this.activeTimers.set(signalId, {
                    isActive: true,
                    endTime: endDate.getTime(),
                    updateInterval: setInterval(() => updateTimerDisplay(), 1000)
                });
            } else {
                clearInterval(this.activeTimers.get(signalId)?.updateInterval);
                this.activeTimers.delete(signalId);
                
                container.innerHTML = `
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
        };
        
        updateTimerDisplay();
    }

    startTimerChecks() {
        setInterval(() => {
            this.activeTimers.forEach((timer, signalId) => {
                if (timer.isActive && Date.now() >= timer.endTime) {
                    this.setupSignalTimer({}, signalId);
                }
            });
        }, 1000);
    }

    giveFeedback(signalId, feedback) {
        const signalElement = document.getElementById(signalId);
        if (!signalElement) return;
        
        const asset = signalElement.dataset.asset;
        console.log(`Feedback for ${asset}: ${feedback}`);
        
        signalElement.remove();
        
        const timer = this.activeTimers.get(signalId);
        if (timer && timer.updateInterval) {
            clearInterval(timer.updateInterval);
        }
        this.activeTimers.delete(signalId);
        
        this.updateSignalCount();
    }

    updateSignalCount() {
        const container = document.getElementById('signals-container');
        const activeSignals = container.querySelectorAll('.signal-card').length;
        document.getElementById('active-signals').textContent = activeSignals;
        
        if (activeSignals === 0) {
            document.getElementById('no-signals').style.display = 'block';
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

    showError(message) {
        const container = document.getElementById('signals-container');
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Помилка</h3>
                <p>${message}</p>
                <button onclick="signalDisplay.loadSignals(true)" class="refresh-btn">
                    <i class="fas fa-redo"></i> Спробувати знову
                </button>
            </div>
        `;
    }

    showMessage(type, text) {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.style.cssText = `
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        if (type === 'success') {
            messageDiv.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
        } else if (type === 'error') {
            messageDiv.style.background = 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
        } else if (type === 'warning') {
            messageDiv.style.background = 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
        }
        
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${text}</span>
        `;
        
        messageContainer.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
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
                element.textContent = translations[key];
            }
        });
    }

    translate(key) {
        return this.translations[this.language][key] || key;
    }
}

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
`;
document.head.appendChild(style);

let signalDisplay;

document.addEventListener('DOMContentLoaded', () => {
    signalDisplay = new SignalDisplay();
    window.signalDisplay = signalDisplay;
});
