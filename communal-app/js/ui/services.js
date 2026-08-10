/**
 * UI компонента Услуги
 */

const ServicesUI = {
    /**
     * Рендеринг страницы услуг
     */
    render() {
        const services = AppState.data.services;
        
        const html = `
            <div class="section-header">
                <h3 class="section-title">Коммунальные услуги</h3>
                <div class="section-actions">
                    <button class="btn btn-primary" onclick="ServicesUI.showAddServiceModal()">
                        + Добавить услугу
                    </button>
                </div>
            </div>
            
            <div class="service-list">
                ${services.map(service => this.renderServiceItem(service)).join('')}
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
    },

    /**
     * Рендеринг элемента услуги
     */
    renderServiceItem(service) {
        const currentTariff = AppState.getCurrentTariff(service.id);
        const currentMonth = Utils.getCurrentMonth();
        const expenses = AnalyticsService.getExpensesByService(currentMonth);
        const expense = expenses.find(e => e.serviceId === service.id);
        
        const prevMonth = Utils.formatDate(Utils.subtractMonths(new Date(), 1), 'input').slice(0, 7);
        const prevExpenses = AnalyticsService.getExpensesByService(prevMonth);
        const prevExpense = prevExpenses.find(e => e.serviceId === service.id);
        
        let changePercent = 0;
        if (prevExpense && prevExpense.cost > 0 && expense) {
            changePercent = Utils.calculatePercentChange(expense.cost, prevExpense.cost);
        }
        
        const calcTypeLabels = {
            meter: 'По счетчику',
            fixed: 'Фиксированная сумма',
            area: 'По площади',
            residents: 'По проживающим',
            volume: 'По объему'
        };
        
        const changeClass = changePercent > 0 ? 'up' : (changePercent < 0 ? 'down' : '');
        const changeText = changePercent !== 0 
            ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
            : '—';

        return `
            <div class="service-item">
                <div class="service-info">
                    <div class="service-name">${Utils.escapeHtml(service.name)}</div>
                    <div class="service-details">
                        Тип расчета: ${calcTypeLabels[service.calcType]} | 
                        Ед. измерения: ${service.unit} |
                        Тариф: ${currentTariff ? Utils.formatCurrency(currentTariff.rate) : 'Не установлен'}
                    </div>
                </div>
                <div class="service-cost">
                    <div class="service-amount">${expense ? Utils.formatCurrency(expense.cost) : '—'}</div>
                    <div class="service-change ${changeClass}">${changeText}</div>
                </div>
                <div class="meter-actions">
                    <button class="btn btn-sm btn-secondary" onclick="ServicesUI.showEditServiceModal('${service.id}')">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="ServicesUI.showTariffHistoryModal('${service.id}')">
                        📊 Тарифы
                    </button>
                    <button class="btn btn-sm ${service.active ? 'btn-warning' : 'btn-success'}" onclick="ServicesUI.toggleService('${service.id}')">
                        ${service.active ? '⏸️' : '▶️'}
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Модальное окно добавления услуги
     */
    showAddServiceModal() {
        const content = `
            <form id="addServiceForm">
                <div class="form-group">
                    <label class="form-label">Название *</label>
                    <input type="text" name="name" class="form-input" placeholder="Например: Домофон" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Категория</label>
                    <input type="text" name="category" class="form-input" placeholder="Например: other">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Единица измерения *</label>
                    <input type="text" name="unit" class="form-input" placeholder="Например: мес" value="мес" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Тип расчета *</label>
                    <select name="calcType" class="form-select" required>
                        <option value="fixed">Фиксированная сумма</option>
                        <option value="meter">По счетчику</option>
                        <option value="area">По площади</option>
                        <option value="residents">По проживающим</option>
                        <option value="volume">По объему (сумма счетчиков)</option>
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Добавить услугу',
            content,
            buttons: [
                { text: 'Отмена', class: 'btn-secondary' },
                { 
                    text: 'Сохранить', 
                    class: 'btn-primary',
                    onClick: () => ServicesUI.saveService()
                }
            ]
        });
    },

    /**
     * Сохранение услуги
     */
    saveService() {
        const formData = Modal.getFormData();
        
        if (!formData.name || !formData.unit || !formData.calcType) {
            Notification.error('Заполните обязательные поля');
            return;
        }
        
        const service = {
            id: Utils.generateId(),
            name: formData.name,
            category: formData.category || 'other',
            unit: formData.unit,
            calcType: formData.calcType,
            active: true
        };
        
        AppState.data.services.push(service);
        AppState.save();
        
        Notification.success('Услуга добавлена');
        this.render();
    },

    /**
     * Модальное окно редактирования услуги
     */
    showEditServiceModal(id) {
        const service = AppState.getServiceById(id);
        if (!service) return;
        
        const content = `
            <form id="editServiceForm">
                <div class="form-group">
                    <label class="form-label">Название *</label>
                    <input type="text" name="name" class="form-input" value="${Utils.escapeHtml(service.name)}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Категория</label>
                    <input type="text" name="category" class="form-input" value="${Utils.escapeHtml(service.category)}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Единица измерения *</label>
                    <input type="text" name="unit" class="form-input" value="${Utils.escapeHtml(service.unit)}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Тип расчета *</label>
                    <select name="calcType" class="form-select" required>
                        <option value="fixed" ${service.calcType === 'fixed' ? 'selected' : ''}>Фиксированная сумма</option>
                        <option value="meter" ${service.calcType === 'meter' ? 'selected' : ''}>По счетчику</option>
                        <option value="area" ${service.calcType === 'area' ? 'selected' : ''}>По площади</option>
                        <option value="residents" ${service.calcType === 'residents' ? 'selected' : ''}>По проживающим</option>
                        <option value="volume" ${service.calcType === 'volume' ? 'selected' : ''}>По объему</option>
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Редактировать услугу',
            content,
            buttons: [
                { text: 'Отмена', class: 'btn-secondary' },
                { 
                    text: 'Сохранить', 
                    class: 'btn-primary',
                    onClick: () => ServicesUI.updateService(id)
                },
                { 
                    text: 'Удалить', 
                    class: 'btn-danger',
                    onClick: () => ServicesUI.deleteService(id)
                }
            ]
        });
    },

    /**
     * Обновление услуги
     */
    updateService(id) {
        const formData = Modal.getFormData();
        const service = AppState.getServiceById(id);
        
        if (service) {
            Object.assign(service, formData);
            AppState.save();
            Notification.success('Услуга обновлена');
            this.render();
        }
    },

    /**
     * Удаление услуги
     */
    deleteService(id) {
        if (confirm('Вы уверены, что хотите удалить эту услугу?')) {
            const index = AppState.data.services.findIndex(s => s.id === id);
            if (index !== -1) {
                AppState.data.services.splice(index, 1);
                AppState.save();
                Notification.success('Услуга удалена');
                this.render();
            }
        }
    },

    /**
     * Переключение активности услуги
     */
    toggleService(id) {
        const service = AppState.getServiceById(id);
        if (service) {
            service.active = !service.active;
            AppState.save();
            Notification.success(service.active ? 'Услуга активирована' : 'Услуга отключена');
            this.render();
        }
    },

    /**
     * Модальное окно истории тарифов
     */
    showTariffHistoryModal(serviceId) {
        const service = AppState.getServiceById(serviceId);
        if (!service) return;
        
        const tariffs = TariffService.getServiceTariffs(serviceId);
        
        const content = `
            <div class="mb-4">
                <h4 class="mb-2">История тарифов: ${Utils.escapeHtml(service.name)}</h4>
            </div>
            
            ${tariffs.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Тариф</th>
                            <th>Действует с</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tariffs.map(t => `
                            <tr>
                                <td>${Utils.formatCurrency(t.rate)}</td>
                                <td>${Utils.formatDate(t.validFrom)}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="ServicesUI.deleteTariff('${t.id}')">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p class="text-secondary">История тарифов пуста</p>'}
            
            <div class="mt-4 pt-4" style="border-top: 1px solid var(--border-color)">
                <h4 class="mb-2">Добавить новый тариф</h4>
                <div class="form-row">
                    <div class="form-group mb-0">
                        <input type="number" step="0.01" id="newTariffRate" class="form-input" placeholder="Размер тарифа">
                    </div>
                    <div class="form-group mb-0">
                        <input type="date" id="newTariffDate" class="form-input" value="${Utils.formatDate(new Date(), 'input')}">
                    </div>
                    <button class="btn btn-primary" onclick="ServicesUI.addTariff('${serviceId}')">Добавить</button>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Тарифы',
            content,
            buttons: [
                { text: 'Закрыть', class: 'btn-secondary' }
            ]
        });
    },

    /**
     * Добавление тарифа
     */
    addTariff(serviceId) {
        const rate = parseFloat(document.getElementById('newTariffRate').value);
        const validFrom = document.getElementById('newTariffDate').value;
        
        if (!rate || rate <= 0) {
            Notification.error('Введите корректный размер тарифа');
            return;
        }
        
        if (!validFrom) {
            Notification.error('Выберите дату действия');
            return;
        }
        
        TariffService.addTariff(serviceId, rate, validFrom);
        Notification.success('Тариф добавлен');
        this.showTariffHistoryModal(serviceId);
    },

    /**
     * Удаление тарифа
     */
    deleteTariff(tariffId) {
        if (confirm('Удалить этот тариф?')) {
            TariffService.deleteTariff(tariffId);
            Notification.success('Тариф удален');
            // Перерисовываем модальное окно
            const serviceId = AppState.data.tariffs.find(t => t.id === tariffId)?.serviceId;
            if (serviceId) {
                this.showTariffHistoryModal(serviceId);
            }
        }
    }
};
