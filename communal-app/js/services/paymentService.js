/**
 * Сервис работы с платежами
 */

const PaymentService = {
    /**
     * Получение всех платежей
     */
    getAllPayments() {
        return Utils.sortByDate(AppState.data.payments, 'date');
    },

    /**
     * Получение платежа по ID
     */
    getPaymentById(id) {
        return AppState.data.payments.find(p => p.id === id);
    },

    /**
     * Добавление нового платежа
     */
    addPayment(data) {
        const payment = {
            id: Utils.generateId(),
            date: data.date,
            period: data.period,
            amount: parseFloat(data.amount),
            services: data.services || 'all',
            method: data.method || 'card',
            comment: data.comment || ''
        };

        AppState.data.payments.push(payment);
        AppState.save();
        return payment;
    },

    /**
     * Обновление платежа
     */
    updatePayment(id, data) {
        const payment = this.getPaymentById(id);
        if (payment) {
            Object.assign(payment, data);
            AppState.save();
            return payment;
        }
        return null;
    },

    /**
     * Удаление платежа
     */
    deletePayment(id) {
        const index = AppState.data.payments.findIndex(p => p.id === id);
        if (index !== -1) {
            AppState.data.payments.splice(index, 1);
            AppState.save();
            return true;
        }
        return false;
    },

    /**
     * Валидация платежа
     */
    validatePayment(data) {
        const errors = {};

        if (!data.date) {
            errors.date = 'Укажите дату';
        }

        if (!data.period) {
            errors.period = 'Укажите период';
        }

        if (!data.amount || data.amount <= 0) {
            errors.amount = 'Сумма должна быть больше 0';
        }

        return errors;
    },

    /**
     * Получение платежей за период
     */
    getPaymentsByPeriod(monthStr) {
        return AppState.data.payments.filter(p => p.period === monthStr);
    },

    /**
     * Получение общей суммы платежей за период
     */
    getTotalByPeriod(monthStr) {
        return Utils.round2(
            this.getPaymentsByPeriod(monthStr)
                .reduce((sum, p) => sum + p.amount, 0)
        );
    },

    /**
     * Фильтрация платежей
     */
    filterPayments(filters) {
        let payments = [...AppState.data.payments];

        if (filters.month) {
            payments = payments.filter(p => p.period.startsWith(filters.month));
        }

        if (filters.year) {
            payments = payments.filter(p => p.period.startsWith(filters.year));
        }

        if (filters.method) {
            payments = payments.filter(p => p.method === filters.method);
        }

        return Utils.sortByDate(payments, 'date');
    },

    /**
     * Получение методов оплаты
     */
    getPaymentMethods() {
        return [
            { value: 'card', label: 'Банковская карта' },
            { value: 'transfer', label: 'Банковский перевод' },
            { value: 'cash', label: 'Наличные' },
            { value: 'autopay', label: 'Автоплатеж' },
            { value: 'other', label: 'Другое' }
        ];
    }
};
