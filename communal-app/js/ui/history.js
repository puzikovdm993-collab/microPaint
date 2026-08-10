/**
 * UI компонента История
 */

const HistoryUI = {
    /**
     * Рендеринг страницы истории
     */
    render() {
        const history = this.getHistoryEvents();
        
        const html = `
            <div class="section-header">
                <h3 class="section-title">История операций</h3>
                ${history.length > 0 ? '<button class="btn btn-danger" onclick="HistoryUI.clearHistory()">Очистить историю</button>' : ''}
            </div>
            
            <div class="filters">
                <div class="filter-group">
                    <label class="filter-label">Тип:</label>
                    <select id="historyFilterType" class="form-select" onchange="HistoryUI.render()">
                        <option value="">Все</option>
                        <option value="reading">Показания</option>
                        <option value="tariff">Тарифы</option>
                        <option value="payment">Платежи</option>
                        <option value="service">Услуги</option>
                    </select>
                </div>
            </div>
            
            ${history.length > 0 ? this.renderHistoryList(history) : this.renderEmptyState()}
        `;

        document.getElementById('contentArea').innerHTML = html;
    },

    /**
     * Очистка всей истории
     */
    clearHistory() {
        Modal.open({
            title: 'Очистить историю',
            content: `
                <div class="modal-content">
                    <p><strong>Внимание!</strong> Это действие удалит все записи истории:</p>
                    <ul style="margin: 1rem 0; padding-left: 1.5rem;">
                        <li>Все показания счетчиков</li>
                        <li>Все платежи</li>
                        <li>Всю историю изменений тарифов</li>
                    </ul>
                    <p class="text-danger">Счетчики и услуги будут сохранены, но их история будет потеряна.</p>
                    <p>Вы уверены?</p>
                </div>
            `,
            buttons: [
                { text: 'Отмена', type: 'secondary', onClick: () => Modal.close() },
                { 
                    text: 'Очистить', 
                    type: 'danger', 
                    onClick: () => {
                        // Очищаем показания
                        AppState.data.readings = [];
                        // Очищаем платежи
                        AppState.data.payments = [];
                        // Очищаем тарифы (историю тарифов)
                        AppState.data.tariffs = [];
                        
                        // Сохраняем изменения
                        StorageService.save();
                        
                        // Закрываем модальное окно
                        Modal.close();
                        
                        // Показываем уведомление
                        Notification.show('История успешно очищена', 'success');
                        
                        // Перерисовываем интерфейс
                        HistoryUI.render();
                        
                        // Обновляем дашборд если он активен
                        if (AppState.currentPage === 'dashboard') {
                            DashboardUI.render();
                        }
                    }
                }
            ]
        });
    },

    /**
     * Получение событий истории
     */
    getHistoryEvents() {
        const events = [];
        
        // События показаний
        AppState.data.readings.forEach(reading => {
            const meter = MeterService.getMeterById(reading.meterId);
            events.push({
                id: reading.id,
                type: 'reading',
                date: reading.date,
                title: 'Внесены показания',
                description: `${meter ? meter.name : 'Счетчик'}: ${reading.value}`,
                amount: null,
                icon: '📊'
            });
        });
        
        // События тарифов
        AppState.data.tariffs.forEach(tariff => {
            const service = AppState.getServiceById(tariff.serviceId);
            events.push({
                id: tariff.id,
                type: 'tariff',
                date: tariff.validFrom,
                title: 'Изменен тариф',
                description: `${service ? service.name : 'Услуга'}: ${Utils.formatCurrency(tariff.rate)}`,
                amount: tariff.rate,
                icon: '💰'
            });
        });
        
        // События платежей
        AppState.data.payments.forEach(payment => {
            events.push({
                id: payment.id,
                type: 'payment',
                date: payment.date,
                title: 'Платеж',
                description: `Период: ${this.formatPeriod(payment.period)}`,
                amount: payment.amount,
                icon: '💳'
            });
        });
        
        // Сортируем по дате (новые сначала)
        return Utils.sortByDate(events, 'date', true);
    },

    /**
     * Форматирование периода
     */
    formatPeriod(periodStr) {
        const [year, month] = periodStr.split('-');
        const monthName = Utils.getMonthName(parseInt(month) - 1);
        return `${monthName} ${year}`;
    },

    /**
     * Список истории
     */
    renderHistoryList(events) {
        // Применяем фильтр по типу
        const typeFilter = document.getElementById('historyFilterType')?.value;
        let filtered = events;
        
        if (typeFilter) {
            filtered = events.filter(e => e.type === typeFilter);
        }

        const typeColors = {
            reading: 'info',
            tariff: 'warning',
            payment: 'success',
            service: 'danger'
        };

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Тип</th>
                            <th>Описание</th>
                            <th>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(event => `
                            <tr>
                                <td>${Utils.formatDate(event.date)}</td>
                                <td><span class="status-badge ${typeColors[event.type]}">${event.icon}</span></td>
                                <td>
                                    <div class="font-weight-600">${Utils.escapeHtml(event.title)}</div>
                                    <div class="text-secondary text-sm">${Utils.escapeHtml(event.description)}</div>
                                </td>
                                <td>${event.amount !== null ? Utils.formatCurrency(event.amount) : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Пустое состояние
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📜</div>
                <div class="empty-state-title">История пуста</div>
                <div class="empty-state-text">Здесь будут отображаться все операции</div>
            </div>
        `;
    }
};
