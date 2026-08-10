/**
 * Управление состоянием приложения
 */

const AppState = {
    // Данные приложения
    data: {
        settings: {
            propertyName: '',
            area: 0,
            residents: 0,
            currency: 'RUB',
            paymentDeadlineDay: 10,
            anomalyThreshold: 20,
            forecastMonths: 3
        },
        services: [],
        meters: [],
        readings: [],
        tariffs: [],
        payments: [],
        expenses: []
    },

    /**
     * Инициализация состояния
     */
    init() {
        const savedData = StorageService.load();
        if (savedData) {
            this.data = savedData;
        } else {
            // Проверяем, был ли пользователь уже в приложении (не первый запуск после очистки)
            const hasBeenInitialized = localStorage.getItem(StorageService.STORAGE_KEY + '_initialized');
            if (!hasBeenInitialized) {
                // Первый запуск - создаем демо-данные
                this.createDemoData();
                localStorage.setItem(StorageService.STORAGE_KEY + '_initialized', 'true');
            }
            // Если был initialized но данных нет - оставляем пустые данные (после очистки)
        }
        return this;
    },

    /**
     * Сохранение состояния
     */
    save() {
        StorageService.save(this.data);
    },

    /**
     * Создание демонстрационных данных
     */
    createDemoData() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Создаем услуги
        this.data.services = [
            { id: 'svc_1', name: 'Электроэнергия', category: 'electricity', unit: 'кВт⋅ч', calcType: 'meter', active: true },
            { id: 'svc_2', name: 'Холодная вода', category: 'water_cold', unit: 'м³', calcType: 'meter', active: true },
            { id: 'svc_3', name: 'Горячая вода', category: 'water_hot', unit: 'м³', calcType: 'meter', active: true },
            { id: 'svc_4', name: 'Газ', category: 'gas', unit: 'м³', calcType: 'meter', active: true },
            { id: 'svc_5', name: 'Отопление', category: 'heating', unit: 'Гкал', calcType: 'area', active: true },
            { id: 'svc_6', name: 'Водоотведение', category: 'sewage', unit: 'м³', calcType: 'volume', active: true },
            { id: 'svc_7', name: 'Вывоз мусора', category: 'trash', unit: 'чел', calcType: 'residents', active: true },
            { id: 'svc_8', name: 'Интернет', category: 'internet', unit: 'мес', calcType: 'fixed', active: true }
        ];

        // Создаем тарифы (история изменений)
        const tariffHistory = [];
        
        // Электроэнергия - несколько изменений тарифа
        tariffHistory.push(
            { id: Utils.generateId(), serviceId: 'svc_1', rate: 4.50, validFrom: `${currentYear - 1}-01-01` },
            { id: Utils.generateId(), serviceId: 'svc_1', rate: 5.20, validFrom: `${currentYear}-01-01` },
            { id: Utils.generateId(), serviceId: 'svc_1', rate: 5.80, validFrom: `${currentYear}-07-01` }
        );

        // Вода
        tariffHistory.push(
            { id: Utils.generateId(), serviceId: 'svc_2', rate: 35.50, validFrom: `${currentYear - 1}-01-01` },
            { id: Utils.generateId(), serviceId: 'svc_2', rate: 38.20, validFrom: `${currentYear}-01-01` }
        );

        tariffHistory.push(
            { id: Utils.generateId(), serviceId: 'svc_3', rate: 180.00, validFrom: `${currentYear - 1}-01-01` },
            { id: Utils.generateId(), serviceId: 'svc_3', rate: 195.50, validFrom: `${currentYear}-01-01` }
        );

        // Газ
        tariffHistory.push(
            { id: Utils.generateId(), serviceId: 'svc_4', rate: 7.20, validFrom: `${currentYear - 1}-01-01` }
        );

        // Отопление
        tariffHistory.push(
            { id: Utils.generateId(), serviceId: 'svc_5', rate: 2100.00, validFrom: `${currentYear - 1}-01-01` }
        );

        // Водоотведение
        tariffHistory.push(
            { id: Utils.generateId(), serviceId: 'svc_6', rate: 28.50, validFrom: `${currentYear - 1}-01-01` }
        );

        // Вывоз мусора
        tariffHistory.push(
            { id: Utils.generateId(), serviceId: 'svc_7', rate: 150.00, validFrom: `${currentYear - 1}-01-01` }
        );

        // Интернет
        tariffHistory.push(
            { id: Utils.generateId(), serviceId: 'svc_8', rate: 450.00, validFrom: `${currentYear - 1}-01-01` }
        );

        this.data.tariffs = tariffHistory;

        // Создаем счетчики
        this.data.meters = [
            { id: 'mtr_1', serviceId: 'svc_1', name: 'Электроэнергия', number: 'ЭЛ123456789', unit: 'кВт⋅ч', type: 'single', canReset: false },
            { id: 'mtr_2', serviceId: 'svc_2', name: 'Холодная вода', number: 'ХВ987654321', unit: 'м³', type: 'cold', canReset: false },
            { id: 'mtr_3', serviceId: 'svc_3', name: 'Горячая вода', number: 'ГВ456789123', unit: 'м³', type: 'hot', canReset: false },
            { id: 'mtr_4', serviceId: 'svc_4', name: 'Газ', number: 'ГЗ789123456', unit: 'м³', type: 'gas', canReset: false }
        ];

        // Генерируем показания за последние 12 месяцев
        const readings = [];
        const baseReadings = {
            'mtr_1': 12000,  // Электроэнергия
            'mtr_2': 450,    // Холодная вода
            'mtr_3': 320,    // Горячая вода
            'mtr_4': 850     // Газ
        };

        const consumptionRates = {
            'mtr_1': { avg: 180, variance: 40 },  // кВт⋅ч в месяц
            'mtr_2': { avg: 5, variance: 2 },      // м³ в месяц
            'mtr_3': { avg: 3, variance: 1.5 },    // м³ в месяц
            'mtr_4': { avg: 12, variance: 5 }      // м³ в месяц
        };

        for (let i = 12; i >= 0; i--) {
            const date = Utils.subtractMonths(now, i);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const day = Math.min(25, date.getDate());
            const readingDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            this.data.meters.forEach(meter => {
                const rate = consumptionRates[meter.id];
                const consumption = rate.avg + (Math.random() - 0.5) * 2 * rate.variance;
                baseReadings[meter.id] += consumption;

                readings.push({
                    id: Utils.generateId(),
                    meterId: meter.id,
                    serviceId: meter.serviceId,
                    date: readingDate,
                    value: Utils.round2(baseReadings[meter.id]),
                    comment: ''
                });
            });
        }

        this.data.readings = readings;

        // Генерируем платежи
        const payments = [];
        for (let i = 11; i >= 0; i--) {
            const date = Utils.subtractMonths(now, i);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            // Примерная сумма платежей
            const baseAmount = 4500 + Math.random() * 1500;
            
            payments.push({
                id: Utils.generateId(),
                date: Utils.formatDate(Utils.addMonths(date, 10), 'input'),
                period: monthStr,
                amount: Utils.round2(baseAmount),
                services: 'all',
                method: ['card', 'transfer', 'cash'][Math.floor(Math.random() * 3)],
                comment: ''
            });
        }

        this.data.payments = payments;

        // Настройки
        this.data.settings = {
            propertyName: 'Дом на Ленина',
            area: 65,
            residents: 3,
            currency: 'RUB',
            paymentDeadlineDay: 10,
            anomalyThreshold: 20,
            forecastMonths: 3
        };

        this.save();
    },

    /**
     * Получение текущего тарифа для услуги
     */
    getCurrentTariff(serviceId, date = null) {
        const checkDate = date || new Date().toISOString().split('T')[0];
        const serviceTariffs = this.data.tariffs
            .filter(t => t.serviceId === serviceId && t.validFrom <= checkDate)
            .sort((a, b) => b.validFrom.localeCompare(a.validFrom));
        
        return serviceTariffs.length > 0 ? serviceTariffs[0] : null;
    },

    /**
     * Получение услуги по ID
     */
    getServiceById(id) {
        return this.data.services.find(s => s.id === id);
    },

    /**
     * Получение счетчика по ID
     */
    getMeterById(id) {
        return this.data.meters.find(m => m.id === id);
    },

    /**
     * Получение последних показаний для счетчика
     */
    getLastReading(meterId) {
        const meterReadings = this.data.readings
            .filter(r => r.meterId === meterId)
            .sort((a, b) => b.date.localeCompare(a.date));
        
        return meterReadings.length > 0 ? meterReadings[0] : null;
    },

    /**
     * Получение предыдущих показаний для счетчика
     */
    getPreviousReading(meterId, currentDate) {
        const meterReadings = this.data.readings
            .filter(r => r.meterId === meterId && r.date < currentDate)
            .sort((a, b) => b.date.localeCompare(a.date));
        
        return meterReadings.length > 0 ? meterReadings[0] : null;
    },

    /**
     * Расчет расходов за месяц
     */
    calculateMonthlyExpenses(monthStr) {
        const expenses = [];
        
        this.data.services.forEach(service => {
            if (!service.active) return;

            let consumption = 0;
            let cost = 0;

            if (service.calcType === 'meter') {
                const meter = this.data.meters.find(m => m.serviceId === service.id);
                if (meter) {
                    const currentReading = this.data.readings
                        .filter(r => r.meterId === meter.id && r.date.startsWith(monthStr))
                        .sort((a, b) => b.date.localeCompare(a.date))[0];
                    
                    const prevMonth = Utils.subtractMonths(new Date(`${monthStr}-15`), 1);
                    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
                    
                    const prevReading = this.data.readings
                        .filter(r => r.meterId === meter.id && r.date.startsWith(prevMonthStr))
                        .sort((a, b) => b.date.localeCompare(a.date))[0];

                    if (currentReading && prevReading) {
                        consumption = currentReading.value - prevReading.value;
                        const tariff = this.getCurrentTariff(service.id, currentReading.date);
                        if (tariff) {
                            cost = Utils.round2(consumption * tariff.rate);
                        }
                    }
                }
            } else if (service.calcType === 'fixed') {
                const tariff = this.getCurrentTariff(service.id);
                if (tariff) {
                    cost = tariff.rate;
                }
            } else if (service.calcType === 'area') {
                const tariff = this.getCurrentTariff(service.id);
                if (tariff) {
                    cost = Utils.round2(tariff.rate * this.data.settings.area / 1000);
                }
            } else if (service.calcType === 'residents') {
                const tariff = this.getCurrentTariff(service.id);
                if (tariff) {
                    cost = Utils.round2(tariff.rate * this.data.settings.residents);
                }
            } else if (service.calcType === 'volume') {
                // Водоотведение = холодная + горячая вода
                const coldMeter = this.data.meters.find(m => m.type === 'cold');
                const hotMeter = this.data.meters.find(m => m.type === 'hot');
                
                let totalVolume = 0;
                [coldMeter, hotMeter].forEach(meter => {
                    if (meter) {
                        const currentReading = this.data.readings
                            .filter(r => r.meterId === meter.id && r.date.startsWith(monthStr))
                            .sort((a, b) => b.date.localeCompare(a.date))[0];
                        
                        const prevMonth = Utils.subtractMonths(new Date(`${monthStr}-15`), 1);
                        const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
                        
                        const prevReading = this.data.readings
                            .filter(r => r.meterId === meter.id && r.date.startsWith(prevMonthStr))
                            .sort((a, b) => b.date.localeCompare(a.date))[0];

                        if (currentReading && prevReading) {
                            totalVolume += currentReading.value - prevReading.value;
                        }
                    }
                });

                consumption = totalVolume;
                const tariff = this.getCurrentTariff(service.id);
                if (tariff) {
                    cost = Utils.round2(totalVolume * tariff.rate);
                }
            }

            if (cost > 0) {
                expenses.push({
                    serviceId: service.id,
                    serviceName: service.name,
                    consumption: consumption,
                    unit: service.unit,
                    cost: cost
                });
            }
        });

        return expenses;
    },

    /**
     * Получение общей суммы начислений за месяц
     */
    getTotalCharges(monthStr) {
        const expenses = this.calculateMonthlyExpenses(monthStr);
        return Utils.round2(expenses.reduce((sum, e) => sum + e.cost, 0));
    },

    /**
     * Получение суммы платежей за месяц
     */
    getTotalPayments(monthStr) {
        return Utils.round2(
            this.data.payments
                .filter(p => p.period === monthStr)
                .reduce((sum, p) => sum + p.amount, 0)
        );
    },

    /**
     * Расчет задолженности
     */
    calculateDebt() {
        const now = new Date();
        let totalCharges = 0;
        let totalPayments = 0;

        // Считаем за последние 12 месяцев
        for (let i = 0; i < 12; i++) {
            const date = Utils.subtractMonths(now, i);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            totalCharges += this.getTotalCharges(monthStr);
            totalPayments += this.getTotalPayments(monthStr);
        }

        return Utils.round2(totalCharges - totalPayments);
    }
};
