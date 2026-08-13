/**
 * UI компонента Счетчики
 */

const MetersUI = {
    /**
     * Рендеринг страницы счетчиков
     */
    render() {
        const meters = MeterService.getAllMeters();
        
        const html = `
            <div class="section-header">
                <h3 class="section-title">Счетчики</h3>
                <div class="section-actions">
                    <button class="btn btn-secondary" onclick="MetersUI.showAddMeterModal()">
                        + Добавить счетчик
                    </button>
                    <button class="btn btn-primary" onclick="MetersUI.showAddReadingModal()">
                        + Внести показания
                    </button>
                </div>
            </div>
            
            ${meters.length > 0 ? this.renderMetersList(meters) : this.renderEmptyState()}
        `;

        document.getElementById('contentArea').innerHTML = html;
    },

    /**
     * Рендеринг списка счетчиков
     */
    renderMetersList(meters) {
        return meters.map(meter => {
            const service = AppState.getServiceById(meter.serviceId);
            const lastReading = AppState.getLastReading(meter.id);
            const currentMonth = Utils.getCurrentMonth();
            const consumption = MeterService.calculateConsumption(meter.id, currentMonth);
            
            // Получаем предыдущее показание
            let prevReading = null;
            if (lastReading) {
                prevReading = AppState.getPreviousReading(meter.id, lastReading.date);
            }
            
            // Текущий тариф
            const tariff = AppState.getCurrentTariff(meter.serviceId);
            
            return `
                <div class="meter-card">
                    <div class="meter-header">
                        <div>
                            <div class="meter-title">${Utils.escapeHtml(meter.name)}</div>
                            <span class="meter-type">№ ${Utils.escapeHtml(meter.number)}</span>
                        </div>
                        <div class="meter-actions">
                            <button class="btn btn-sm btn-secondary" onclick="MetersUI.showEditMeterModal('${meter.id}')">
                                ✏️ Редактировать
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="MetersUI.deleteMeter('${meter.id}')">
                                🗑️ Удалить
                            </button>
                        </div>
                    </div>
                    
                    <div class="meter-readings">
                        <div class="reading-item">
                            <div class="reading-label">Предыдущие показания</div>
                            <div class="reading-value">
                                ${prevReading ? Utils.formatNumber(prevReading.value, 2) : '—'}
                            </div>
                            <div class="reading-unit">${meter.unit}</div>
                        </div>
                        
                        <div class="reading-item">
                            <div class="reading-label">Текущие показания</div>
                            <div class="reading-value">
                                ${lastReading ? Utils.formatNumber(lastReading.value, 2) : '—'}
                            </div>
                            <div class="reading-unit">${meter.unit}</div>
                        </div>
                        
                        <div class="reading-item">
                            <div class="reading-label">Расход за месяц</div>
                            <div class="reading-value">
                                ${consumption ? Utils.formatNumber(consumption.consumption, 2) : '—'}
                            </div>
                            <div class="reading-unit">${meter.unit}</div>
                        </div>
                        
                        <div class="reading-item">
                            <div class="reading-label">Тариф</div>
                            <div class="reading-value">
                                ${tariff ? Utils.formatCurrency(tariff.rate) : '—'}
                            </div>
                            <div class="reading-unit">за ${meter.unit}</div>
                        </div>
                        
                        <div class="reading-item">
                            <div class="reading-label">Стоимость</div>
                            <div class="reading-value">
                                ${consumption ? Utils.formatCurrency(consumption.cost) : '—'}
                            </div>
                            <div class="reading-unit"></div>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" onclick="MetersUI.showAddReadingModal('${meter.id}')">
                        + Внести показания
                    </button>
                </div>
            `;
        }).join('');
    },

    /**
     * Пустое состояние
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">⚡</div>
                <div class="empty-state-title">Нет счетчиков</div>
                <div class="empty-state-text">Добавьте первый счетчик для учета показаний</div>
                <button class="btn btn-primary" onclick="MetersUI.showAddMeterModal()">
                    + Добавить счетчик
                </button>
            </div>
        `;
    },

    /**
     * Модальное окно добавления счетчика
     */
    showAddMeterModal() {
        const services = AppState.data.services.filter(s => s.calcType === 'meter');
        
        // Если нет услуг с типом "по счетчику", предлагаем сначала создать услуги
        if (services.length === 0) {
            Notification.info('Сначала добавьте коммунальные услуги с типом расчета "По счетчику"');
            ServicesUI.showAddServiceModal();
            // После добавления услуги нужно будет вернуться к добавлению счетчика
            window.pendingMeterAdd = true;
            return;
        }
        
        const content = `
            <form id="addMeterForm">
                <div class="form-group">
                    <label class="form-label">Услуга *</label>
                    <select name="serviceId" class="form-select" required>
                        <option value="">Выберите услугу</option>
                        ${services.map(s => `<option value="${s.id}">${Utils.escapeHtml(s.name)}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Название *</label>
                    <input type="text" name="name" class="form-input" placeholder="Например: Электроэнергия" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Номер счетчика *</label>
                    <input type="text" name="number" class="form-input" placeholder="Например: ЭЛ123456789" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Единица измерения *</label>
                    <input type="text" name="unit" class="form-input" placeholder="Например: кВт⋅ч" value="кВт⋅ч" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Тип счетчика</label>
                    <select name="type" class="form-select">
                        <option value="single">Однотарифный</option>
                        <option value="cold">Холодная вода</option>
                        <option value="hot">Горячая вода</option>
                        <option value="gas">Газ</option>
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Добавить счетчик',
            content,
            minWidth: 450,
            minHeight: 300,
            requiredFields: ['serviceId', 'name', 'number', 'unit'],
            buttons: [
                { text: 'Отмена', class: 'btn-secondary' },
                { 
                    text: 'Сохранить', 
                    class: 'btn-primary',
                    onClick: () => MetersUI.saveMeter()
                }
            ]
        });
    },

    /**
     * Сохранение счетчика
     */
    saveMeter() {
        const formData = Modal.getFormData();
        const errors = {};
        
        if (!formData.serviceId) errors.serviceId = 'Выберите услугу';
        if (!formData.name) errors.name = 'Введите название';
        if (!formData.number) errors.number = 'Введите номер';
        if (!formData.unit) errors.unit = 'Введите единицу измерения';
        
        if (Object.keys(errors).length > 0) {
            Modal.showErrors(errors);
            return;
        }
        
        MeterService.addMeter(formData);
        Notification.success('Счетчик добавлен');
        this.render();
    },

    /**
     * Модальное окно редактирования счетчика
     */
    showEditMeterModal(id) {
        const meter = MeterService.getMeterById(id);
        if (!meter) return;
        
        const services = AppState.data.services.filter(s => s.calcType === 'meter');
        
        const content = `
            <form id="editMeterForm">
                <div class="form-group">
                    <label class="form-label">Услуга *</label>
                    <select name="serviceId" class="form-select" required>
                        ${services.map(s => `<option value="${s.id}" ${s.id === meter.serviceId ? 'selected' : ''}>${Utils.escapeHtml(s.name)}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Название *</label>
                    <input type="text" name="name" class="form-input" value="${Utils.escapeHtml(meter.name)}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Номер счетчика *</label>
                    <input type="text" name="number" class="form-input" value="${Utils.escapeHtml(meter.number)}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Единица измерения *</label>
                    <input type="text" name="unit" class="form-input" value="${Utils.escapeHtml(meter.unit)}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Тип счетчика</label>
                    <select name="type" class="form-select">
                        <option value="single" ${meter.type === 'single' ? 'selected' : ''}>Однотарифный</option>
                        <option value="cold" ${meter.type === 'cold' ? 'selected' : ''}>Холодная вода</option>
                        <option value="hot" ${meter.type === 'hot' ? 'selected' : ''}>Горячая вода</option>
                        <option value="gas" ${meter.type === 'gas' ? 'selected' : ''}>Газ</option>
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Редактировать счетчик',
            content,
            minWidth: 450,
            minHeight: 300,
            requiredFields: ['serviceId', 'name', 'number', 'unit'],
            buttons: [
                { text: 'Отмена', class: 'btn-secondary' },
                { 
                    text: 'Сохранить', 
                    class: 'btn-primary',
                    onClick: () => MetersUI.updateMeter(id)
                }
            ]
        });
    },

    /**
     * Обновление счетчика
     */
    updateMeter(id) {
        const formData = Modal.getFormData();
        MeterService.updateMeter(id, formData);
        Notification.success('Счетчик обновлен');
        this.render();
    },

    /**
     * Удаление счетчика
     */
    deleteMeter(id) {
        if (confirm('Вы уверены, что хотите удалить этот счетчик? Все связанные показания будут удалены.')) {
            MeterService.deleteMeter(id);
            Notification.success('Счетчик удален');
            this.render();
        }
    },

    /**
     * Модальное окно внесения показаний
     */
    showAddReadingModal(meterId = '') {
        const meters = MeterService.getAllMeters();
        const lastReading = meterId ? AppState.getLastReading(meterId) : null;
        
        const content = `
            <form id="addReadingForm">
                <div class="form-group">
                    <label class="form-label">Счетчик *</label>
                    <select name="meterId" class="form-select" required ${meterId ? 'disabled' : ''}>
                        <option value="">Выберите счетчик</option>
                        ${meters.map(m => `
                            <option value="${m.id}" ${m.id === meterId ? 'selected' : ''}>
                                ${Utils.escapeHtml(m.name)} (${m.number})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Дата *</label>
                    <input type="date" name="date" class="form-input" value="${Utils.formatDate(new Date(), 'input')}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Показания *</label>
                    <input type="number" step="0.01" name="value" class="form-input" placeholder="Введите текущие показания" required>
                    ${lastReading ? `<div class="mt-2 text-secondary">Предыдущие показания: ${lastReading.value}</div>` : ''}
                </div>
                
                <div class="form-group">
                    <label class="form-label">Комментарий</label>
                    <textarea name="comment" class="form-textarea" placeholder="Необязательно"></textarea>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Внести показания',
            content,
            minWidth: 400,
            minHeight: 280,
            requiredFields: ['meterId', 'date', 'value'],
            buttons: [
                { text: 'Отмена', class: 'btn-secondary' },
                { 
                    text: 'Сохранить', 
                    class: 'btn-primary',
                    onClick: () => MetersUI.saveReading()
                }
            ]
        });
    },

    /**
     * Сохранение показаний
     */
    saveReading() {
        const formData = Modal.getFormData();
        const errors = MeterService.validateReading(formData);
        
        if (Object.keys(errors).length > 0) {
            Modal.showErrors(errors);
            return;
        }
        
        const result = MeterService.addReading(formData);
        
        if (result.error) {
            Notification.error(result.error);
            return;
        }
        
        Notification.success('Показания сохранены');
        this.render();
    }
};
