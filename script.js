class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.historyUrl = 'data/history.json';
        this.updateInterval = 5000; // Перевірка нових даних кожні 5 секунд
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.signalsGenerated = false;
        this.signalsGenerationTime = null;
        this.canRefresh = false;
        this.isGenerating = false;
        
        // Налаштування GitHub API
        this.githubToken = localStorage.getItem('github_token');
        this.githubRepo = ''; // Тут потрібно вказати ваш репозиторій у форматі "username/repo"
        this.githubWorkflowId = 'signals.yml';
        
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
                searchBtn: "Пошук сигналів",
                searchAgain: "Шукати знову",
                updateBtn: "Оновити",
                welcome: "Ласкаво просимо до AI Trading Signals!",
                welcomeDesc: "Натисніть кнопку 'Пошук сигналів' для початку аналізу",
                refreshAvailableIn: "Оновлення доступне через",
                minutes: "хв",
                seconds: "сек",
                refreshNow: "Оновити зараз",
                timerActive: "Таймер активний:",
                timeUntilEntry: "Час до входу:",
                entryIn: "Вхід через",
                signalActive: "Сигнал активний",
                signalExpired: "Сигнал завершено",
                currentTime: "Поточний час (Київ):",
                call: "КУПИТИ",
                put: "ПРОДАТИ",
                reasonAnalysis: "Аналіз AI:",
                generated: "Створено:",
                duration: "Тривалість:",
                confidence: "Впевненість:",
                entryTime: "Час входу:",
                high: "Висока",
                medium: "Середня",
                low: "Низька",
                error: "Помилка",
                tryAgain: "Спробувати знову",
                searchFirst: "Спочатку знайдіть сигнали",
                waitFiveMinutes: "Очікуйте 5 хвилин після пошуку",
                calculating: "Розрахунок...",
                timezone: "Часовий пояс",
                minute: "хвилина",
                minutes: "хвилин",
                activeFor: "Активний",
                expired: "Завершено",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так",
                feedbackNo: "Ні",
                feedbackSkip: "Я не перевіряв",
                githubSetup: "Налаштування GitHub API",
                githubTokenInfo: "Для використання кнопки 'Пошук сигналів' налаштуйте GitHub токен",
                enterToken: "Введіть GitHub токен:",
                saveToken: "Зберегти токен",
                generating: "Генерація сигналів...",
                generationStarted: "Генерація сигналів запущена!",
                checkStatus: "Перевірка статусу...",
                generationSuccess: "Сигнали успішно згенеровані!",
                generationError: "Помилка генерації сигналів",
                setupInstructions: "Інструкція: 1. Перейдіть в GitHub Tokens 2. Створіть новий токен з правами 'repo' 3. Скопіюйте токен і вставте сюди"
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
                autoUpdate: "Сигналы обновляются автоматично",
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
                searchBtn: "Поиск сигналов",
                searchAgain: "Искать снова",
                updateBtn: "Обновить",
                welcome: "Добро пожаловать в AI Trading Signals!",
                welcomeDesc: "Нажмите кнопку 'Поиск сигналов' для начала анализа",
                refreshAvailableIn: "Обновление доступно через",
                minutes: "мин",
                seconds: "сек",
                refreshNow: "Обновить сейчас",
                timerActive: "Таймер активен:",
                timeUntilEntry: "Время до входа:",
                entryIn: "Вход через",
                signalActive: "Сигнал активен",
                signalExpired: "Сигнал завершен",
                currentTime: "Текущее время (Киев):",
                call: "КОЛЛ",
                put: "ПУТ",
                reasonAnalysis: "Анализ AI:",
                generated: "Создано:",
                duration: "Длительность:",
                confidence: "Уверенность:",
                entryTime: "Время входа:",
                high: "Высокая",
                medium: "Средняя",
                low: "Низкая",
                error: "Ошибка",
                tryAgain: "Попробовать снова",
                searchFirst: "Сначала найдите сигналы",
                waitFiveMinutes: "Ожидайте 5 минут после поиска",
                calculating: "Расчет...",
                timezone: "Часовой пояс",
                minute: "минута",
                minutes: "минут",
                activeFor: "Активен",
                expired: "Завершен",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да",
                feedbackNo: "Нет",
                feedbackSkip: "Я не проверял",
                githubSetup: "Настройка GitHub API",
                githubTokenInfo: "Для использования кнопки 'Поиск сигналов' настройте GitHub токен",
                enterToken: "Введите GitHub токен:",
                saveToken: "Сохранить токен",
                generating: "Генерация сигналов...",
                generationStarted: "Генерация сигналов запущена!",
                checkStatus: "Проверка статуса...",
                generationSuccess: "Сигналы успешно сгенерированы!",
                generationError: "Ошибка генерации сигналов",
                setupInstructions: "Инструкция: 1. Перейдите в GitHub Tokens 2. Создайте новый токен с правами 'repo' 3. Скопируйте токен и вставьте сюда"
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Додаємо обробники для кнопок
        document.getElementById('search-btn').addEventListener('click', () => {
            this.startSignalSearch();
        });
        
        const initialBtn = document.getElementById('initial-search-btn');
        if (initialBtn) {
            initialBtn.addEventListener('click', () => {
                this.startSignalSearch();
            });
        }
        
        const retryBtn = document.getElementById('retry-search-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.startSignalSearch();
            });
        }
        
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.forceRefresh();
        });
        
        // Перевіряємо, чи є збережені сигнали при завантаженні
        await this.checkExistingSignals();
        
        // Оновлюємо кнопку оновлення кожну секунду
        setInterval(() => this.updateRefreshButton(), 1000);
        
        // Перевіряємо налаштування GitHub токена
        this.checkGitHubSetup();
    }

    checkGitHubSetup() {
        if (!this.githubToken) {
            this.showGitHubTokenSetup();
        }
    }

    showGitHubTokenSetup() {
        const container = document.getElementById('signals-container');
        container.innerHTML = `
            <div class="github-setup">
                <i class="fab fa-github"></i>
                <h3>${this.translate('githubSetup')}</h3>
                <p>${this.translate('githubTokenInfo')}</p>
                <div class="token-input">
                    <input type="password" id="github-token-input" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
                    <button id="save-token-btn" class="search-btn">
                        ${this.translate('saveToken')}
                    </button>
                </div>
                <small>
                    ${this.translate('setupInstructions')}
                </small>
            </div>
        `;
        
        document.getElementById('save-token-btn').addEventListener('click', () => {
            this.saveGitHubToken();
        });
    }

    saveGitHubToken() {
        const tokenInput = document.getElementById('github-token-input');
        if (tokenInput.value) {
            this.githubToken = tokenInput.value;
            localStorage.setItem('github_token', tokenInput.value);
            alert('Токен збережено! Тепер ви можете шукати сигнали.');
            location.reload();
        }
    }

    async startSignalSearch() {
        if (!this.githubToken) {
            this.showGitHubTokenSetup();
            return;
        }
        
        if (this.isGenerating) {
            alert(this.translate('generating'));
            return;
        }
        
        const searchBtn = document.getElementById('search-btn');
        const initialBtn = document.getElementById('initial-search-btn');
        
        searchBtn.classList.add('spinning');
        if (initialBtn) initialBtn.classList.add('spinning');
        this.isGenerating = true;
        
        try {
            // Запускаємо GitHub Actions workflow
            await this.triggerGitHubWorkflow();
            
            // Показуємо повідомлення
            this.showGenerationStatus(this.translate('generationStarted'));
            
            // Чекаємо завершення генерації (перевіряємо кожні 10 секунд)
            await this.waitForGeneration();
            
            // Завантажуємо нові сигнали
            await this.loadSignals(true);
            
            this.signalsGenerated = true;
            this.signalsGenerationTime = new Date();
            this.updateRefreshButton();
            
            this.showGenerationStatus(this.translate('generationSuccess'));
            
            // Перезавантажуємо сторінку через 2 секунди, щоб показати сигнали
            setTimeout(() => {
                this.loadSignals(true);
            }, 2000);
            
        } catch (error) {
            console.error('Помилка генерації сигналів:', error);
            this.showError(this.translate('generationError') + ': ' + error.message);
        } finally {
            searchBtn.classList.remove('spinning');
            if (initialBtn) initialBtn.classList.remove('spinning');
            this.isGenerating = false;
        }
    }

    async triggerGitHubWorkflow() {
        // Переконайтеся, що ви встановили правильний репозиторій
        if (!this.githubRepo) {
            // Спробуємо автоматично отримати репозиторій з URL
            const repoMatch = window.location.pathname.match(/\/([^\/]+\/[^\/]+)/);
            if (repoMatch) {
                this.githubRepo = repoMatch[1];
            } else {
                throw new Error('Будь ласка, встановіть змінну githubRepo у коді (рядок 12)');
            }
        }
        
        const url = `https://api.github.com/repos/${this.githubRepo}/actions/workflows/${this.githubWorkflowId}/dispatches`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.githubToken}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: {
                    manual_trigger: 'true'
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }
        
        return response;
    }

    async waitForGeneration() {
        let attempts = 0;
        const maxAttempts = 30; // Максимум 30 спроб (5 хвилин)
        
        while (attempts < maxAttempts) {
            attempts++;
            
            // Чекаємо 10 секунд
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Перевіряємо, чи оновилися сигнали
            const signalsUpdated = await this.checkSignalsUpdated();
            
            if (signalsUpdated) {
                return true;
            }
            
            // Оновлюємо статус
            this.showGenerationStatus(`${this.translate('checkStatus')} (${attempts * 10} сек)`);
        }
        
        throw new Error('Генерація зайняла занадто багато часу');
    }

    async checkSignalsUpdated() {
        try {
            const response = await fetch(this.signalsUrl + '?t=' + new Date().getTime());
            if (!response.ok) return false;
            
            const data = await response.json();
            if (!data.last_update) return false;
            
            const lastUpdate = new Date(data.last_update);
            const now = new Date();
            
            // Якщо сигнали оновлені менше 2 хвилин тому
            return (now - lastUpdate) < 120000;
        } catch {
            return false;
        }
    }

    showGenerationStatus(message) {
        const container = document.getElementById('signals-container');
        container.innerHTML = `
            <div class="generation-status">
                <div class="spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <h3>${message}</h3>
                <p>Це може зайняти 1-2 хвилини...</p>
            </div>
        `;
    }

    async checkExistingSignals() {
        try {
            const response = await fetch(this.signalsUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.signals && data.signals.length > 0) {
                    this.signalsGenerated = true;
                    this.signalsGenerationTime = new Date(data.last_update);
                    this.processSignals(data);
                    this.updateRefreshButton();
                }
            }
        } catch (error) {
            console.log('Немає збережених сигналів');
        }
    }

    updateRefreshButton() {
        const refreshBtn = document.getElementById('refresh-btn');
        const now = new Date();
        
        if (!this.signalsGenerated || !this.signalsGenerationTime) {
            refreshBtn.disabled = true;
            refreshBtn.title = this.translate('searchFirst');
            return;
        }
        
        const timeDiff = now - this.signalsGenerationTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeDiff >= fiveMinutes) {
            refreshBtn.disabled = false;
            refreshBtn.title = this.translate('refreshNow');
            this.canRefresh = true;
        } else {
            refreshBtn.disabled = true;
            const remaining = fiveMinutes - timeDiff;
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            refreshBtn.title = `${this.translate('refreshAvailableIn')} ${minutes}:${seconds.toString().padStart(2, '0')}`;
            this.canRefresh = false;
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
            this.showError('Не вдалося завантажити сигнали. Спробуйте пізніше.');
        }
    }

    processSignals(data, force = false) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        const welcomeState = document.querySelector('.welcome-state');
        const lastUpdate = document.getElementById('last-update');
        const activeSignalsElement = document.getElementById('active-signals');
        
        if (!data || !data.signals || data.signals.length === 0) {
            if (welcomeState) welcomeState.style.display = 'none';
            container.innerHTML = '';
            noSignals.style.display = 'block';
            lastUpdate.textContent = '--:--:--';
            activeSignalsElement.textContent = '0';
            return;
        }
        
        if (welcomeState) welcomeState.style.display = 'none';
        noSignals.style.display = 'none';
        
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatKyivTime(updateDate, true);
        }
        
        const nowKyiv = this.getKyivTime();
        const fiveMinutesAgo = new Date(nowKyiv.getTime() - 5 * 60000);
        
        let activeSignals = 0;
        let html = '';
        
        data.signals.forEach((signal, index) => {
            const confidencePercent = Math.round(signal.confidence * 100);
            if (confidencePercent < 70) return;
            
            const generatedAt = new Date(signal.generated_at);
            if (generatedAt < fiveMinutesAgo && !force) return;
            
            activeSignals++;
            
            const signalId = `signal-${index}`;
            html += this.createSignalHTML(signal, signalId);
        });
        
        activeSignalsElement.textContent = activeSignals;
        
        if (activeSignals === 0) {
            noSignals.style.display = 'block';
            container.innerHTML = '';
        } else {
            container.innerHTML = html;
            
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
        const entryTime = signal.entry_time || 'Не вказано';
        const duration = signal.duration || '2';
        
        let generatedTime = 'Не вказано';
        if (signal.generated_at) {
            const genDate = new Date(signal.generated_at);
            generatedTime = this.formatKyivTime(genDate, false);
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
                            <small>${this.translate('currentTime')} ${this.formatKyivTime(new Date(), true)}</small>
                        </div>
                    </div>
                    <div class="direction-badge">
                        ${signal.direction === 'UP' ? '📈 ' + this.translate('call') : '📉 ' + this.translate('put')}
                    </div>
                </div>
                
                <div class="signal-details">
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-bullseye"></i> ${this.translate('confidence')}
                        </div>
                        <div class="value">
                            ${confidencePercent}%
                            <span class="confidence-badge ${confidenceClass}">
                                ${confidencePercent >= 80 ? this.translate('high') : confidencePercent >= 70 ? this.translate('medium') : this.translate('low')}
                            </span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="far fa-clock"></i> ${this.translate('entryTime')}
                        </div>
                        <div class="value">
                            <div class="signal-time">
                                <span class="kyiv-time">${entryTime}</span>
                                <small>(${this.translate('kievTime')})</small>
                            </div>
                            <div class="time-until" id="time-until-${signalId}"></div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-hourglass-half"></i> ${this.translate('duration')}
                        </div>
                        <div class="value">${duration} ${parseInt(duration) === 1 ? this.translate('minute') : this.translate('minutes')}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-calendar"></i> ${this.translate('generated')}
                        </div>
                        <div class="value">${generatedTime}</div>
                    </div>
                </div>
                
                <div class="signal-timer waiting" id="timer-${signalId}">
                    <div class="timer-display" id="timer-display-${signalId}">
                        ${this.translate('calculating')}...
                    </div>
                    <small id="timer-status-${signalId}">${this.translate('timeUntilEntry')}</small>
                </div>
                
                ${signal.reason ? `
                <div class="signal-reason">
                    <div class="reason-header">
                        <i class="fas fa-lightbulb"></i> ${this.translate('reasonAnalysis')}
                    </div>
                    <div class="reason-text">${signal.reason}</div>
                </div>
                ` : ''}
                
                <div class="signal-footer">
                    <span><i class="fas fa-globe-europe"></i> ${this.translate('timezone')}: Київ (UTC+2)</span>
                    <span><i class="fas fa-brain"></i> ${this.translate('model')}: Llama 4</span>
                </div>
            </div>
        `;
    }

    setupSignalTimer(signal, signalId) {
        const entryTime = signal.entry_time;
        const duration = parseInt(signal.duration) || 2;
        
        if (!entryTime) return;
        
        const updateTimer = () => {
            const nowKyiv = this.getKyivTime();
            const [hours, minutes] = entryTime.split(':').map(Number);
            const entryDate = new Date(nowKyiv);
            entryDate.setHours(hours, minutes, 0, 0);
            
            if (entryDate < nowKyiv) {
                entryDate.setDate(entryDate.getDate() + 1);
            }
            
            const endDate = new Date(entryDate.getTime() + duration * 60000);
            const timeLeftMs = entryDate - nowKyiv;
            
            const timerElement = document.getElementById(`timer-${signalId}`);
            const timerDisplay = document.getElementById(`timer-display-${signalId}`);
            const timerStatus = document.getElementById(`timer-status-${signalId}`);
            const timeUntilElement = document.getElementById(`time-until-${signalId}`);
            
            if (timeLeftMs > 0) {
                const minutesLeft = Math.floor(timeLeftMs / 60000);
                const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);
                
                timerElement.className = 'signal-timer waiting';
                timerDisplay.textContent = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
                timerStatus.textContent = `${this.translate('entryIn')} ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
                
                if (timeUntilElement) {
                    timeUntilElement.textContent = `${minutesLeft}${this.translate('minutes')} ${secondsLeft}${this.translate('seconds')}`;
                }
            } else if (nowKyiv <= endDate) {
                const timeActiveMs = nowKyiv - entryDate;
                const minutesActive = Math.floor(timeActiveMs / 60000);
                const secondsActive = Math.floor((timeActiveMs % 60000) / 1000);
                const timeLeftMsTotal = endDate - nowKyiv;
                const minutesLeft = Math.floor(timeLeftMsTotal / 60000);
                const secondsLeft = Math.floor((timeLeftMsTotal % 60000) / 1000);
                
                timerElement.className = 'signal-timer active';
                timerDisplay.textContent = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
                timerStatus.textContent = `${this.translate('signalActive')} (${minutesActive}:${secondsActive.toString().padStart(2, '0')})`;
                
                if (timeUntilElement) {
                    timeUntilElement.textContent = `${this.translate('activeFor')} ${minutesActive}:${secondsActive.toString().padStart(2, '0')}`;
                }
            } else {
                timerElement.className = 'signal-timer expired';
                timerDisplay.textContent = '0:00';
                timerStatus.textContent = this.translate('signalExpired');
                
                if (timeUntilElement) {
                    timeUntilElement.textContent = this.translate('expired');
                }
                
                setTimeout(() => {
                    this.showFeedback(signalId, signal.asset);
                }, 30000);
            }
        };
        
        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        this.activeTimers.set(signalId, intervalId);
    }

    showFeedback(signalId, asset) {
        const timerElement = document.getElementById(`timer-${signalId}`);
        if (timerElement) {
            timerElement.innerHTML = `
                <div class="signal-feedback">
                    <p>${this.translate('feedbackQuestion')}</p>
                    <div class="feedback-buttons">
                        <button class="feedback-btn feedback-yes" onclick="signalDisplay.giveFeedback('${signalId}', 'yes')">
                            ${this.translate('feedbackYes')}
                        </button>
                        <button class="feedback-btn feedback-no" onclick="signalDisplay.giveFeedback('${signalId}', 'no')">
                            ${this.translate('feedbackNo')}
                        </button>
                        <button class="feedback-btn feedback-skip" onclick="signalDisplay.giveFeedback('${signalId}', 'skip')">
                            ${this.translate('feedbackSkip')}
                        </button>
                    </div>
                </div>
            `;
        }
    }

    giveFeedback(signalId, feedback) {
        console.log(`Feedback for ${signalId}: ${feedback}`);
        
        const intervalId = this.activeTimers.get(signalId);
        if (intervalId) {
            clearInterval(intervalId);
            this.activeTimers.delete(signalId);
        }
        
        const signalElement = document.getElementById(signalId);
        if (signalElement) {
            signalElement.remove();
        }
        
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

    forceRefresh() {
        if (!this.canRefresh) {
            alert(this.translate('waitFiveMinutes'));
            return;
        }
        
        const btn = document.getElementById('refresh-btn');
        btn.classList.add('spinning');
        
        this.loadSignals(true).finally(() => {
            setTimeout(() => {
                btn.classList.remove('spinning');
                this.signalsGenerationTime = new Date();
                this.updateRefreshButton();
            }, 1000);
        });
    }

    updateKyivTime() {
        const nowKyiv = this.getKyivTime();
        const timeElement = document.getElementById('server-time');
        
        if (timeElement) {
            timeElement.textContent = this.formatKyivTime(nowKyiv, true);
        }
    }

    getKyivTime() {
        const now = new Date();
        const offset = 2;
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * offset));
    }

    formatKyivTime(date, includeSeconds = false) {
        return date.toLocaleTimeString('uk-UA', {
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
                <h3>${this.translate('error')}</h3>
                <p>${message}</p>
                <button onclick="signalDisplay.startSignalSearch()" class="search-btn">
                    <i class="fas fa-redo"></i> ${this.translate('tryAgain')}
                </button>
            </div>
        `;
    }

    async setupLanguage() {
        this.applyLanguage(this.language);
        
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
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        if (this.signalsGenerated) {
            this.loadSignals();
        }
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

let signalDisplay;

document.addEventListener('DOMContentLoaded', () => {
    signalDisplay = new SignalDisplay();
    window.signalDisplay = signalDisplay;
});
