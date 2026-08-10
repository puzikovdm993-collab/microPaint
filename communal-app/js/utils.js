/**
 * Вспомогательные утилиты
 */

const Utils = {
    /**
     * Генерация уникального ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Форматирование числа как валюты
     */
    formatCurrency(amount, currency = 'RUB') {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Форматирование числа
     */
    formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    },

    /**
     * Форматирование даты
     */
    formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString('ru-RU');
        } else if (format === 'long') {
            return d.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } else if (format === 'input') {
            return d.toISOString().split('T')[0];
        }
        return d.toLocaleDateString('ru-RU');
    },

    /**
     * Получение текущего месяца в формате YYYY-MM
     */
    getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    /**
     * Получение названия месяца
     */
    getMonthName(monthIndex) {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return months[monthIndex] || '';
    },

    /**
     * Парсинг строки месяца YYYY-MM
     */
    parseMonth(monthStr) {
        const [year, month] = monthStr.split('-').map(Number);
        return { year, month };
    },

    /**
     * Добавление месяцев к дате
     */
    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    },

    /**
     * Вычитание месяцев из даты
     */
    subtractMonths(date, months) {
        return this.addMonths(date, -months);
    },

    /**
     * Получение списка месяцев за последние N месяцев
     */
    getLastNMonths(n) {
        const months = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const date = this.subtractMonths(now, i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            months.push(`${year}-${month}`);
        }
        return months;
    },

    /**
     * Расчет разницы в процентах
     */
    calculatePercentChange(current, previous) {
        if (!previous || previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return ((current - previous) / previous) * 100;
    },

    /**
     * Форматирование процентов
     */
    formatPercent(value) {
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    },

    /**
     * Округление до 2 знаков после запятой
     */
    round2(num) {
        return Math.round(num * 100) / 100;
    },

    /**
     * Безопасное получение значения из input
     */
    getInputValue(selector) {
        const el = document.querySelector(selector);
        return el ? el.value : '';
    },

    /**
     * Установка значения в input
     */
    setInputValue(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.value = value;
    },

    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Группировка массива по ключу
     */
    groupBy(array, keyFn) {
        return array.reduce((result, item) => {
            const key = keyFn(item);
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push(item);
            return result;
        }, {});
    },

    /**
     * Сортировка массива по дате
     */
    sortByDate(array, dateField = 'date', descending = true) {
        return [...array].sort((a, b) => {
            const dateA = new Date(a[dateField]);
            const dateB = new Date(b[dateField]);
            return descending ? dateB - dateA : dateA - dateB;
        });
    },

    /**
     * Проверка на пустое значение
     */
    isEmpty(value) {
        return value === null || value === undefined || value === '';
    },

    /**
     * Получение дней между двумя датами
     */
    getDaysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};
