/**
 * Data Models
 * Define the structure and factory functions for all data entities
 */

const Models = {
    /**
     * Service categories
     */
    CATEGORIES: {
        WATER: 'water',
        ELECTRICITY: 'electricity',
        HEATING: 'heating',
        MAINTENANCE: 'maintenance',
        WASTE: 'waste',
        PHONE: 'phone',
        OTHER: 'other'
    },

    /**
     * Accrual sources
     */
    SOURCES: {
        MANUAL: 'manual',
        CALCULATED: 'calculated',
        IMPORTED: 'imported'
    },

    /**
     * Month statuses
     */
    STATUSES: {
        DRAFT: 'draft',
        FILLED: 'filled',
        VERIFIED: 'verified',
        CLOSED: 'closed'
    },

    /**
     * Create a new Service object
     */
    createService(data = {}) {
        return {
            id: data.id || Utils.generateId(),
            name: data.name || '',
            shortName: data.shortName || '',
            category: data.category || this.CATEGORIES.OTHER,
            unit: data.unit || '',
            meterId: data.meterId || null,
            isMetered: data.isMetered || false,
            isActive: data.isActive !== undefined ? data.isActive : true,
            description: data.description || '',
            formula: data.formula || null, // For calculated services like водоотведение
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
        };
    },

    /**
     * Create a new Meter object
     */
    createMeter(data = {}) {
        return {
            id: data.id || Utils.generateId(),
            name: data.name || '',
            type: data.type || '', // water, electricity, gas, heat
            unit: data.unit || '',
            serialNumber: data.serialNumber || '',
            installationDate: data.installationDate || null,
            initialValue: data.initialValue || 0,
            isActive: data.isActive !== undefined ? data.isActive : true,
            replacementDate: data.replacementDate || null,
            notes: data.notes || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
        };
    },

    /**
     * Create a new MeterReading object
     */
    createMeterReading(data = {}) {
        return {
            id: data.id || Utils.generateId(),
            meterId: data.meterId || '',
            month: data.month || '', // YYYY-MM format
            value: data.value || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            comment: data.comment || ''
        };
    },

    /**
     * Create a new Tariff object
     */
    createTariff(data = {}) {
        return {
            id: data.id || Utils.generateId(),
            serviceId: data.serviceId || '',
            value: data.value || 0,
            unit: data.unit || '',
            validFrom: data.validFrom || '', // YYYY-MM format
            validTo: data.validTo || null, // YYYY-MM format, null means current
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
        };
    },

    /**
     * Create a new Accrual object
     */
    createAccrual(data = {}) {
        return {
            id: data.id || Utils.generateId(),
            serviceId: data.serviceId || '',
            month: data.month || '', // YYYY-MM format
            volume: data.volume || 0,
            tariff: data.tariff || 0,
            amount: data.amount || 0,
            calculatedAmount: data.calculatedAmount || null,
            source: data.source || this.SOURCES.MANUAL,
            comment: data.comment || '',
            parameters: data.parameters || {}, // Additional parameters for specific services
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
        };
    },

    /**
     * Create a new Month object
     */
    createMonth(data = {}) {
        const [year, month] = (data.id || '').split('-');
        return {
            id: data.id || '', // YYYY-MM format
            year: parseInt(year) || 0,
            month: parseInt(month) || 0,
            status: data.status || this.STATUSES.DRAFT,
            comment: data.comment || '',
            totalAmount: data.totalAmount || 0,
            closedAt: data.closedAt || null,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
        };
    },

    /**
     * Validate Service
     */
    validateService(service) {
        const errors = [];
        if (!service.name) errors.push('Название услуги обязательно');
        if (!service.unit) errors.push('Единица измерения обязательна');
        if (!Object.values(this.CATEGORIES).includes(service.category)) {
            errors.push('Некорректная категория');
        }
        return errors;
    },

    /**
     * Validate MeterReading
     */
    validateMeterReading(reading) {
        const errors = [];
        if (!reading.meterId) errors.push('ID счетчика обязателен');
        if (!reading.month) errors.push('Месяц обязателен');
        if (typeof reading.value !== 'number' || reading.value < 0) {
            errors.push('Значение должно быть неотрицательным числом');
        }
        return errors;
    },

    /**
     * Validate Accrual
     */
    validateAccrual(accrual) {
        const errors = [];
        if (!accrual.serviceId) errors.push('ID услуги обязателен');
        if (!accrual.month) errors.push('Месяц обязателен');
        if (typeof accrual.volume !== 'number' || accrual.volume < 0) {
            errors.push('Объем должен быть неотрицательным числом');
        }
        if (typeof accrual.tariff !== 'number' || accrual.tariff < 0) {
            errors.push('Тариф должен быть неотрицательным числом');
        }
        return errors;
    },

    /**
     * Get default services configuration
     */
    getDefaultServices() {
        return [
            // Water services
            this.createService({
                id: 'hv', name: 'Холодная вода', shortName: 'ХВ',
                category: this.CATEGORIES.WATER, unit: 'м³',
                isMetered: true, meterId: 'hv-meter'
            }),
            this.createService({
                id: 'gv', name: 'Горячая вода', shortName: 'ГВ',
                category: this.CATEGORIES.WATER, unit: 'м³',
                isMetered: true, meterId: 'gv-meter'
            }),
            this.createService({
                id: 'vo', name: 'Водоотведение', shortName: 'ВО',
                category: this.CATEGORIES.WATER, unit: 'м³',
                isMetered: false, formula: 'hv + gv'
            }),
            this.createService({
                id: 'hv-gv', name: 'ХВ для ГВ', shortName: 'ХВ для ГВ',
                category: this.CATEGORIES.WATER, unit: 'м³',
                isMetered: false
            }),
            this.createService({
                id: 'heat-gv', name: 'Теплоэнергия для ГВ', shortName: 'Тепло на ГВ',
                category: this.CATEGORIES.HEATING, unit: 'Гкал',
                isMetered: false
            }),

            // Electricity services
            this.createService({
                id: 'el', name: 'Электроэнергия', shortName: 'Эл',
                category: this.CATEGORIES.ELECTRICITY, unit: 'кВт·ч',
                isMetered: true, meterId: 'el-meter'
            }),
            this.createService({
                id: 'el-io', name: 'Электроэнергия ИО', shortName: 'Эл ИО',
                category: this.CATEGORIES.ELECTRICITY, unit: 'кВт·ч',
                isMetered: false
            }),

            // Heating services
            this.createService({
                id: 'heating', name: 'Отопление', shortName: 'Отопление',
                category: this.CATEGORIES.HEATING, unit: 'Гкал',
                isMetered: false
            }),

            // Maintenance services
            this.createService({
                id: 'housing', name: 'Содержание жилья', shortName: 'Содержание',
                category: this.CATEGORIES.MAINTENANCE, unit: 'м²',
                isMetered: false
            }),
            this.createService({
                id: 'housing-io', name: 'Содержание ОИ', shortName: 'Содержание ОИ',
                category: this.CATEGORIES.MAINTENANCE, unit: 'м²',
                isMetered: false
            }),

            // Waste services
            this.createService({
                id: 'tko', name: 'ТКО', shortName: 'ТКО',
                category: this.CATEGORIES.WASTE, unit: 'м³',
                isMetered: false
            }),

            // Other services
            this.createService({
                id: 'phone', name: 'Телефон', shortName: 'Телефон',
                category: this.CATEGORIES.PHONE, unit: 'усл.ед',
                isMetered: false
            })
        ];
    },

    /**
     * Get default meters configuration
     */
    getDefaultMeters() {
        return [
            this.createMeter({
                id: 'hv-meter', name: 'Холодная вода',
                type: 'water', unit: 'м³',
                serialNumber: '',
                initialValue: 0
            }),
            this.createMeter({
                id: 'gv-meter', name: 'Горячая вода',
                type: 'water', unit: 'м³',
                serialNumber: '',
                initialValue: 0
            }),
            this.createMeter({
                id: 'el-meter', name: 'Электроэнергия',
                type: 'electricity', unit: 'кВт·ч',
                serialNumber: '',
                initialValue: 0
            })
        ];
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Models;
}
