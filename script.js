
class SignalDisplay {
    constructor() {
        // Тепер шлях до даних відносно кореня
        this.signalsUrl = 'data/signals.json';
        this.updateInterval = 10000; // 10 секунд
        this.init();
    }

    async init() {
        await this.loadSignals();
        this.startAutoUpdate();
    }

    async loadSignals() {
        try {
            // Додаємо timestamp, щоб уникнути кешування
            const response = await fetch(`${this.signalsUrl}?t=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.updateDisplay(data);
        } catch (error) {
            console.error('Помилка завантаження сигналів:', error);
            this.showError('Не вдалося завантажити сигнали. Спробуйте оновити сторінку.');
        }
    }

    updateDisplay(data) {
        const container = document.getElementById('signals-container');
        const lastUpdate = document.getElementById('last-update');
        const activeSignals = document.getElementById('active-signals');

        if (!data || !data.signals) {
            container.innerHTML = '<div class="loading"><i class="fas fa-exclamation-circle"></i><p>Немає доступних сигналів</p></div>';
            return;
        }

        // Оновлюємо статистику
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = updateDate.toLocaleString('uk-UA');
            
            // Показуємо, скільки часу тому
            const now = new Date();
            const diffMs = now - updateDate;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) {
                lastUpdate.textContent += ' (щойно)';
            } else {
                lastUpdate.textContent += ` (${diffMins} хв. тому)`;
            }
        }
        
        activeSignals.textContent = data.signals.length;

        // Генеруємо сигнали
        if (data.signals.length === 0) {
            container.innerHTML = '<div class="signal-card"><p>Наразі немає сигналів з впевненістю >70%</p></div>';
            return;
        }

        let html = '';
        data.signals.forEach(signal => {
            const confidencePercent = Math.round(signal.confidence * 100);
            const time = new Date(signal.timestamp || signal.generated_at).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Визначаємо колір для впевненості
            let confidenceClass = 'neutral';
            if (confidencePercent >= 85) confidenceClass = 'high';
            else if (confidencePercent >= 70) confidenceClass = 'medium';
            
            html += `
                <div class="signal-card ${signal.direction.toLowerCase()}">
                    <div class="signal-header">
                        <div class="asset">
                            <i class="fas fa-chart-line"></i> ${signal.asset}
                        </div>
                        <div class="direction ${signal.direction.toLowerCase()}">
                            ${signal.direction === 'UP' ? '📈 CALL' : '📉 PUT'}
                        </div>
                    </div>
                    <div class="signal-details">
                        <div class="confidence ${confidenceClass}">
                            <i class="fas fa-bullseye"></i> Впевненість: 
                            <span class="confidence-value">${confidencePercent}%</span>
                        </div>
                        <div class="time">
                            <i class="far fa-clock"></i> Час входу: <strong>${signal.entry_time || time}</strong>
                        </div>
                    </div>
                    ${signal.reason ? `
                    <div class="reason">
                        <i class="fas fa-lightbulb"></i> <strong>Аналіз:</strong> ${signal.reason}
                    </div>
                    ` : ''}
                    <div class="signal-footer">
                        <span class="timestamp">
                            <i class="far fa-calendar"></i> Створено: ${time}
                        </span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    showError(message) {
        const container = document.getElementById('signals-container');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Помилка завантаження</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">
                    <i class="fas fa-redo"></i> Спробувати знову
                </button>
            </div>
        `;
    }

    startAutoUpdate() {
        // Оновлюємо кожні 10 секунд
        setInterval(() => this.loadSignals(), this.updateInterval);
        
        // Також оновлюємо при поверненні на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadSignals();
            }
        });
    }
}

// Запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    new SignalDisplay();
    
    // Додаємо кнопку оновлення вручну
    const updateBtn = document.createElement('button');
    updateBtn.className = 'manual-update-btn';
    updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Оновити';
    updateBtn.onclick = () => {
        updateBtn.classList.add('spinning');
        setTimeout(() => updateBtn.classList.remove('spinning'), 1000);
        new SignalDisplay().loadSignals();
    };
    
    const header = document.querySelector('header');
    header.appendChild(updateBtn);
});
