/**
 * UI компонента Платежи
 */

const PaymentsUI = {
    /**
     * Рендеринг страницы платежей
     */
    render() {
        const payments = PaymentService.getAllPayments();
        
        const html = `
            <div class="section-header">
                <h3 class="section-title">Платежи</h3>
                <div class="section-actions">
                    <button class="btn btn-primary" onclick="PaymentsUI.showAddPaymentModal()">
                        + Добавить платеж
                    </button>
                </div>
            </div>
            
            <div class="filters">
                <div class="filter-group">
                    <label class="filter-label">Год:</label>
                    <select id="filterYear" class="form-select" onchange="PaymentsUI.render()">
                        <option value="">Все</option>
                        ${this.getYearOptions()}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Метод:</label>
                    <select id="filterMethod" class="form-select" onchange="PaymentsUI.render()">
                        <option value="">Все</option>
                        ${this.getMethodOptions()}
                    </select>
                </div>
            </div>
            
            ${payments.length > 0 ? this.renderPaymentsTable(payments) : this.renderEmptyState()}
        `;

        document.getElementById('contentArea').innerHTML = html;
    },

    /**
     * Опции годов
     */
    getYearOptions() {
        const years = [...new Set(AppState.data.payments.map(p => p.period.substring(0, 4)))];
        years.sort((a, b) => b - a);
        return years.map(y => `<option value="${y}">${y}</option>`).join('');
    },

    /**
     * Опции методов оплаты
     */
    getMethodOptions() {
        const methods = PaymentService.getPaymentMethods();
        return methods.map(m => `<option value="${m.value}">${m.label}</option>`).join('');
    },

    /**
     * Таблица платежей
     */
    renderPaymentsTable(payments) {
        // Применяем фильтры
        const yearFilter = document.getElementById('filterYear')?.value;
        const methodFilter = document.getElementById('filterMethod')?.value;
        
        let filtered = payments;
        if (yearFilter) {
            filtered = filtered.filter(p => p.period.startsWith(yearFilter));
        }
        if (methodFilter) {
            filtered = filtered.filter(p => p.method === methodFilter);
        }

        const methodLabels = {
            card: 'Карта',
            transfer: 'Перевод',
            cash: 'Наличные',
            autopay: 'Автоплатеж',
            other: 'Другое'
        };

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Период</th>
                            <th>Сумма</th>
                            <th>Услуги</th>
                            <th>Способ оплаты</th>
                            <th>Комментарий</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(payment => `
                            <tr>
                                <td>${Utils.formatDate(payment.date)}</td>
                                <td>${this.formatPeriod(payment.period)}</td>
                                <td>${Utils.formatCurrency(payment.amount)}</td>
                                <td>${payment.services === 'all' ? 'Все услуги' : payment.services}</td>
                                <td><span class="status-badge info">${methodLabels[payment.method] || payment.method}</span></td>
                                <td>${Utils.escapeHtml(payment.comment)}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="PaymentsUI.showEditPaymentModal('${payment.id}')">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="PaymentsUI.deletePayment('${payment.id}')">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
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
     * Пустое состояние
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <div class="empty-state-title">Нет платежей</div>
                <div class="empty-state-text">Добавьте первый платеж для учета оплат</div>
                <button class="btn btn-primary" onclick="PaymentsUI.showAddPaymentModal()">
                    + Добавить платеж
                </button>
            </div>
        `;
    },

    /**
     * Модальное окно добавления платежа
     */
    showAddPaymentModal() {
        const currentMonth = Utils.getCurrentMonth();
        const methods = PaymentService.getPaymentMethods();
        
        const content = `
            <form id="addPaymentForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Дата *</label>
                        <input type="date" name="date" class="form-input" value="${Utils.formatDate(new Date(), 'input')}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Период *</label>
                        <input type="month" name="period" class="form-input" value="${currentMonth}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Сумма *</label>
                    <input type="number" step="0.01" name="amount" class="form-input" placeholder="Например: 5000" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Способ оплаты</label>
                    <select name="method" class="form-select">
                        ${methods.map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Комментарий</label>
                    <textarea name="comment" class="form-textarea" placeholder="Необязательно"></textarea>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Добавить платеж',
            content,
            buttons: [
                { text: 'Отмена', class: 'btn-secondary' },
                { 
                    text: 'Сохранить', 
                    class: 'btn-primary',
                    onClick: () => PaymentsUI.savePayment()
                }
            ]
        });
    },

    /**
     * Сохранение платежа
     */
    savePayment() {
        const formData = Modal.getFormData();
        const errors = PaymentService.validatePayment(formData);
        
        if (Object.keys(errors).length > 0) {
            Modal.showErrors(errors);
            return;
        }
        
        PaymentService.addPayment(formData);
        Notification.success('Платеж добавлен');
        this.render();
    },

    /**
     * Модальное окно редактирования платежа
     */
    showEditPaymentModal(id) {
        const payment = PaymentService.getPaymentById(id);
        if (!payment) return;
        
        const methods = PaymentService.getPaymentMethods();
        
        const content = `
            <form id="editPaymentForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Дата *</label>
                        <input type="date" name="date" class="form-input" value="${payment.date}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Период *</label>
                        <input type="month" name="period" class="form-input" value="${payment.period}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Сумма *</label>
                    <input type="number" step="0.01" name="amount" class="form-input" value="${payment.amount}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Способ оплаты</label>
                    <select name="method" class="form-select">
                        ${methods.map(m => `<option value="${m.value}" ${m.value === payment.method ? 'selected' : ''}>${m.label}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Комментарий</label>
                    <textarea name="comment" class="form-textarea">${Utils.escapeHtml(payment.comment)}</textarea>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Редактировать платеж',
            content,
            buttons: [
                { text: 'Отмена', class: 'btn-secondary' },
                { 
                    text: 'Сохранить', 
                    class: 'btn-primary',
                    onClick: () => PaymentsUI.updatePayment(id)
                }
            ]
        });
    },

    /**
     * Обновление платежа
     */
    updatePayment(id) {
        const formData = Modal.getFormData();
        PaymentService.updatePayment(id, formData);
        Notification.success('Платеж обновлен');
        this.render();
    },

    /**
     * Удаление платежа
     */
    deletePayment(id) {
        if (confirm('Вы уверены, что хотите удалить этот платеж?')) {
            PaymentService.deletePayment(id);
            Notification.success('Платеж удален');
            this.render();
        }
    }
};
