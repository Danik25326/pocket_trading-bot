class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.updateInterval = 10000; // 10 секунд
        this.kyivOffset = 2; // UTC+2 для Києва
        this.init();
    }

    async init() {
        await this.loadSignals();
        this.startAutoUpdate();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
    }

    async loadSignals() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${this.signalsUrl}?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.updateDisplay(data);
            
        } catch (error) {
            console.error('Помилка завантаження:', error);
            this.showError('Не вдалося завантажити сигнали. Спробуйте пізніше.');
        }
    }

    updateDisplay(data) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        const lastUpdate = document.getElementById('last-update');
        const activeSignals = document.getElementById('active-signals');
        
        if (!data || !data.signals || data.signals.length === 0) {
            container.innerHTML = '';
            noSignals.style.display = 'block';
            lastUpdate.textContent = 'Немає даних';
            activeSignals.textContent = '0';
            return;
        }
        
        noSignals.style.display = 'none';
        
        // Оновлюємо час останнього оновлення
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            const kyivTime = this.convertToKyivTime(updateDate);
            lastUpdate.textContent = kyivTime.toLocaleString('uk-UA');
            
            // Додаємо часовий пояс
            lastUpdate.textContent += ' (Київ)';
        }
        
        // Оновлюємо кількість активних сигналів
        activeSignals.textContent = data.signals.length;
        
        // Створюємо HTML для сигналів
        let html = '';
        
        data.signals.forEach(signal => {
            const confidencePercent = Math.round(signal.confidence * 100);
            const confidenceClass = this.getConfidenceClass(confidencePercent);
            const directionClass = signal.direction.toLowerCase();
            const entryTime = signal.entry_time || 'Не вказано';
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
                <div class="signal-card ${directionClass}">
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
                                <i class="fas fa-bullseye"></i> Впевненість
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
                            <div class="value">${duration} хв</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="label">
                                <i class="fas fa-calendar"></i> Створено
                            </div>
                            <div class="value">${generatedTime}</div>
                        </div>
                    </div>
                    
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
        });
        
        container.innerHTML = html;
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

    convertToKyivTime(date) {
        // Додаємо 2 години для UTC+2 (Київ)
        return new Date(date.getTime() + (this.kyivOffset * 60 * 60 * 1000));
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
                <button onclick="location.reload()" class="refresh-btn">
                    <i class="fas fa-redo"></i> Спробувати знову
                </button>
            </div>
        `;
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
}

// Запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    const signalDisplay = new SignalDisplay();
    
    // Додаємо кнопку оновлення
    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'manual-refresh';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Оновити';
    refreshBtn.className = 'refresh-btn';
    refreshBtn.onclick = () => {
        refreshBtn.classList.add('spinning');
        signalDisplay.loadSignals().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('spinning'), 1000);
        });
    };
    
    document.querySelector('header').appendChild(refreshBtn);
});
