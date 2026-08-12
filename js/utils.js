/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

const Utils = {
    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Format number with precision
     */
    formatNumber(value, precision = 2) {
        if (value === null || value === undefined || isNaN(value)) return '—';
        return Number(value).toFixed(precision);
    },

    /**
     * Format currency
     */
    formatCurrency(value, currency = 'RUB') {
        const symbols = { RUB: '₽', USD: '$', EUR: '€' };
        const symbol = symbols[currency] || '₽';
        return `${this.formatNumber(value, 2)} ${symbol}`;
    },

    /**
     * Format volume (m³)
     */
    formatVolume(value) {
        return this.formatNumber(value, 3);
    },

    /**
     * Format energy (kWh)
     */
    formatEnergy(value) {
        return this.formatNumber(value, 2);
    },

    /**
     * Format month as MM.YYYY
     */
    formatMonth(monthStr) {
        if (!monthStr) return '';
        const [year, month] = monthStr.split('-');
        return `${month}.${year}`;
    },

    /**
     * Parse month string to YYYY-MM
     */
    parseMonth(monthStr) {
        if (!monthStr) return '';
        const parts = monthStr.split('.');
        if (parts.length === 2) {
            return `${parts[1]}-${parts[0].padStart(2, '0')}`;
        }
        return monthStr;
    },

    /**
     * Get month name in Russian
     */
    getMonthName(monthNum) {
        const names = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return names[parseInt(monthNum) - 1] || '';
    },

    /**
     * Get short month name
     */
    getShortMonthName(monthNum) {
        const names = [
            'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
            'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
        ];
        return names[parseInt(monthNum) - 1] || '';
    },

    /**
     * Format month for display (Июль 2026)
     */
    formatMonthDisplay(monthStr) {
        if (!monthStr) return '';
        const [year, month] = monthStr.split('-');
        return `${this.getMonthName(month)} ${year}`;
    },

    /**
     * Add months to a date string
     */
    addMonths(monthStr, count) {
        const [year, month] = monthStr.split('-').map(Number);
        const date = new Date(year, month - 1 + count, 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    },

    /**
     * Compare two month strings
     */
    compareMonths(month1, month2) {
        return month1.localeCompare(month2);
    },

    /**
     * Get months range
     */
    getMonthsRange(startMonth, endMonth) {
        const months = [];
        let current = startMonth;
        while (this.compareMonths(current, endMonth) <= 0) {
            months.push(current);
            current = this.addMonths(current, 1);
        }
        return months;
    },

    /**
     * Calculate percentage change
     */
    calculatePercentChange(current, previous) {
        if (previous === 0 || previous === null || previous === undefined) {
            return current > 0 ? 100 : 0;
        }
        return ((current - previous) / previous) * 100;
    },

    /**
     * Format percentage
     */
    formatPercent(value) {
        if (value === null || value === undefined || isNaN(value)) return '—';
        const sign = value > 0 ? '+' : '';
        return `${sign}${this.formatNumber(value, 1)}%`;
    },

    /**
     * Clamp number between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Round to specific decimal places
     */
    roundTo(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Parse CSV line
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    },

    /**
     * Download file
     */
    downloadFile(filename, content, mimeType = 'application/json') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * Group array by key
     */
    groupBy(array, keyFn) {
        return array.reduce((result, item) => {
            const key = keyFn(item);
            if (!result[key]) result[key] = [];
            result[key].push(item);
            return result;
        }, {});
    },

    /**
     * Sum array values
     */
    sum(array, keyFn = null) {
        if (!array || array.length === 0) return 0;
        if (keyFn) {
            return array.reduce((acc, item) => acc + (keyFn(item) || 0), 0);
        }
        return array.reduce((acc, val) => acc + (val || 0), 0);
    },

    /**
     * Safe division
     */
    safeDivide(numerator, denominator, defaultValue = 0) {
        if (denominator === 0 || denominator === null || denominator === undefined) {
            return defaultValue;
        }
        return numerator / denominator;
    },

    /**
     * Check if value is numeric
     */
    isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * Parse numeric value safely
     */
    parseNumeric(value, defaultValue = 0) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
