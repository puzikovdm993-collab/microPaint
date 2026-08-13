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
            // Проверяем, был ли пользователь уже в приложении
            const hasBeenInitialized = localStorage.getItem(StorageService.STORAGE_KEY + '_initialized');
            const hasBeenCleared = localStorage.getItem(StorageService.STORAGE_KEY + '_cleared');
            
            // Создаем демо-данные только если это самый первый запуск приложения
            // и данные не были очищены вручную
            if (!hasBeenInitialized && !hasBeenCleared) {
                this.createDemoData();
                localStorage.setItem(StorageService.STORAGE_KEY + '_initialized', 'true');
            } else {
                // Если данные были очищены или не загружены - инициализируем пустыми данными
                this.data = {
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
                };
                // Сохраняем пустые данные, чтобы они были доступны сразу
                this.save();
            }
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
     * Создание демонстрационных данных на основе реальных данных пользователя
     */
    createDemoData() {
        // Настройки - площадь 59.2 м² из данных
        this.data.settings = {
            propertyName: 'Квартира',
            area: 59.2,
            residents: 3,
            currency: 'RUB',
            paymentDeadlineDay: 10,
            anomalyThreshold: 20,
            forecastMonths: 3
        };

        // Создаем услуги на основе данных
        // ОИ - общего использования, ГВ - горячая вода, ХВ - холодная вода, ВО - водоотведение, Эл - электроэнергия
        this.data.services = [
            { id: 'svc_content', name: 'Содержание жилья', category: 'maintenance', unit: 'м²', calcType: 'area', active: true },
            { id: 'svc_gv_io', name: 'ГВ ИО (горячая вода общедомовая)', category: 'water_hot', unit: 'м³', calcType: 'volume', active: true },
            { id: 'svc_xv_io', name: 'ХВ ИО (холодная вода общедомовая)', category: 'water_cold', unit: 'м³', calcType: 'volume', active: true },
            { id: 'svc_vo_io', name: 'ВО ИО (водоотведение общедомовое)', category: 'sewage', unit: 'м³', calcType: 'volume', active: true },
            { id: 'svc_el_io', name: 'Эл ИО (электроэнергия общедомовая)', category: 'electricity', unit: 'кВт⋅ч', calcType: 'volume', active: true },
            { id: 'svc_tko', name: 'ТКО (вывоз мусора)', category: 'trash', unit: 'м³', calcType: 'fixed', active: true },
            { id: 'svc_vo', name: 'ВО (водоотведение)', category: 'sewage', unit: 'м³', calcType: 'volume_sum', active: true },
            { id: 'svc_xv', name: 'ХВ (холодная вода)', category: 'water_cold', unit: 'м³', calcType: 'meter', active: true },
            { id: 'svc_xv_gv', name: 'ХВ для ГВ (подогрев воды)', category: 'water_cold', unit: 'м³', calcType: 'meter', active: true },
            { id: 'svc_heat_gv', name: 'Теплоэнергия для ГВ', category: 'heating', unit: 'Гкал', calcType: 'volume', active: true },
            { id: 'svc_heating', name: 'Отопление', category: 'heating', unit: 'Гкал', calcType: 'volume', active: true },
            { id: 'svc_phone', name: 'Телефон', category: 'communication', unit: 'мес', calcType: 'fixed', active: true },
            { id: 'svc_el', name: 'Эл (электроэнергия)', category: 'electricity', unit: 'кВт⋅ч', calcType: 'meter', active: true }
        ];

        // Создаем тарифы на основе данных (период 02.2026 - 07.2026)
        const tariffHistory = [];
        
        // Содержание жилья - 43.42 руб/м²
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_content', rate: 43.42, validFrom: '2026-01-01' });
        
        // ГВ ИО - 126.04 руб/м³
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_gv_io', rate: 126.04, validFrom: '2026-01-01' });
        
        // ХВ ИО - 29.86 руб/м³
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_xv_io', rate: 29.86, validFrom: '2026-01-01' });
        
        // ВО ИО - 37.19 руб/м³
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_vo_io', rate: 37.19, validFrom: '2026-01-01' });
        
        // Эл ИО - 3.39 руб/кВт⋅ч
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_el_io', rate: 3.39, validFrom: '2026-01-01' });
        
        // ТКО - 552.61 руб/м³
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_tko', rate: 552.61, validFrom: '2026-01-01' });
        
        // ВО (водоотведение) - 37.19 руб/м³
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_vo', rate: 37.19, validFrom: '2026-01-01' });
        
        // ХВ (холодная вода) - 29.58 руб/м³ (до 04.2026), затем 29.58, 30.98 с 05.2026, 31.71 с 06.2026
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_xv', rate: 29.58, validFrom: '2026-01-01' });
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_xv_gv', rate: 29.58, validFrom: '2026-01-01' });
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_xv_gv', rate: 30.98, validFrom: '2026-05-01' });
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_xv_gv', rate: 31.71, validFrom: '2026-06-01' });
        // Обновление тарифа на ХВ с 06.2026
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_xv', rate: 31.71, validFrom: '2026-06-01' });
        
        // Теплоэнергия для ГВ и Отопление - 2021.2 руб/Гкал
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_heat_gv', rate: 2021.2, validFrom: '2026-01-01' });
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_heating', rate: 2021.2, validFrom: '2026-01-01' });
        
        // Телефон - 358 руб/мес
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_phone', rate: 358.0, validFrom: '2026-07-01' });
        
        // Эл (электроэнергия) - 3.39 руб/кВт⋅ч
        tariffHistory.push({ id: Utils.generateId(), serviceId: 'svc_el', rate: 3.39, validFrom: '2026-01-01' });

        this.data.tariffs = tariffHistory;

        // Создаем счетчики только для индивидуальных услуг
        this.data.meters = [
            { id: 'mtr_el', serviceId: 'svc_el', name: 'Электроэнергия', number: 'ЭЛ001', unit: 'кВт⋅ч', type: 'single', canReset: false },
            { id: 'mtr_xv', serviceId: 'svc_xv', name: 'Холодная вода', number: 'ХВ001', unit: 'м³', type: 'cold', canReset: false },
            { id: 'mtr_gv', serviceId: 'svc_xv_gv', name: 'Горячая вода', number: 'ГВ001', unit: 'м³', type: 'hot', canReset: false }
        ];

        // Создаем показания счетчиков из данных
        // Эл: 8 (02.2026), 513 (03.2026), 651 (04.2026), 821 (05.2026), 898 (06.2026)
        // ХВ: 15.754 (02.2026), 23.664 (03.2026), 29.951 (04.2026), 36.469 (05.2026), 28.949 (06.2026), 42.04 (07.2026)
        // ГВ: 6.95 (02.2026), 9.459 (03.2026), 12.269 (04.2026), 15.336 (05.2026), 17.213 (06.2026), 19.01 (07.2026)
        const readings = [
            // Электроэнергия
            { id: Utils.generateId(), meterId: 'mtr_el', serviceId: 'svc_el', date: '2026-02-25', value: 8, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_el', serviceId: 'svc_el', date: '2026-03-25', value: 513, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_el', serviceId: 'svc_el', date: '2026-04-25', value: 651, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_el', serviceId: 'svc_el', date: '2026-05-25', value: 821, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_el', serviceId: 'svc_el', date: '2026-06-25', value: 898, comment: '' },
            
            // Холодная вода
            { id: Utils.generateId(), meterId: 'mtr_xv', serviceId: 'svc_xv', date: '2026-02-25', value: 15.754, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_xv', serviceId: 'svc_xv', date: '2026-03-25', value: 23.664, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_xv', serviceId: 'svc_xv', date: '2026-04-25', value: 29.951, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_xv', serviceId: 'svc_xv', date: '2026-05-25', value: 36.469, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_xv', serviceId: 'svc_xv', date: '2026-06-25', value: 28.949, comment: 'Перерасчет' },
            { id: Utils.generateId(), meterId: 'mtr_xv', serviceId: 'svc_xv', date: '2026-07-25', value: 42.04, comment: '' },
            
            // Горячая вода
            { id: Utils.generateId(), meterId: 'mtr_gv', serviceId: 'svc_xv_gv', date: '2026-02-25', value: 6.95, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_gv', serviceId: 'svc_xv_gv', date: '2026-03-25', value: 9.459, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_gv', serviceId: 'svc_xv_gv', date: '2026-04-25', value: 12.269, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_gv', serviceId: 'svc_xv_gv', date: '2026-05-25', value: 15.336, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_gv', serviceId: 'svc_xv_gv', date: '2026-06-25', value: 17.213, comment: '' },
            { id: Utils.generateId(), meterId: 'mtr_gv', serviceId: 'svc_xv_gv', date: '2026-07-25', value: 19.01, comment: '' }
        ];

        this.data.readings = readings;

        // Создаем платежи на основе начислений из данных
        // Суммируем начисления по месяцам (из таблицы пользователя)
        const payments = [
            { id: Utils.generateId(), date: '2026-03-10', period: '2026-02', amount: 7175.01, services: 'all', method: 'card', comment: '' },
            { id: Utils.generateId(), date: '2026-04-10', period: '2026-03', amount: 8362.50, services: 'all', method: 'card', comment: '' },
            { id: Utils.generateId(), date: '2026-05-10', period: '2026-04', amount: 5988.84, services: 'all', method: 'card', comment: '' },
            { id: Utils.generateId(), date: '2026-06-10', period: '2026-05', amount: 5489.68, services: 'all', method: 'card', comment: '' },
            { id: Utils.generateId(), date: '2026-07-10', period: '2026-06', amount: 3598.17, services: 'all', method: 'card', comment: '' },
            { id: Utils.generateId(), date: '2026-08-10', period: '2026-07', amount: 3865.65, services: 'all', method: 'card', comment: '' }
        ];

        this.data.payments = payments;

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
                    // Содержание жилья = тариф * площадь
                    cost = Utils.round2(tariff.rate * this.data.settings.area);
                }
            } else if (service.calcType === 'residents') {
                const tariff = this.getCurrentTariff(service.id);
                if (tariff) {
                    cost = Utils.round2(tariff.rate * this.data.settings.residents);
                }
            } else if (service.calcType === 'volume' || service.calcType === 'volume_sum') {
                // Для услуг типа "volume" используем предопределенные объемы из данных
                // Это нужно для общедомовых услуг и других, где объем фиксированный
                const volumes = this.getServiceVolumes(monthStr, service.id);
                if (volumes.consumption !== null) {
                    consumption = volumes.consumption;
                    const tariff = this.getCurrentTariff(service.id);
                    if (tariff) {
                        cost = Utils.round2(consumption * tariff.rate);
                    }
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
     * Получение объемов потребления для услуг с типом volume
     * Возвращает предопределенные значения из данных пользователя
     */
    getServiceVolumes(monthStr, serviceId) {
        // Данные объемов и начислений из таблицы пользователя
        // Примечание: svc_xv, svc_xv_gv и svc_el теперь имеют calcType: 'meter' и рассчитываются по счетчикам
        const serviceData = {
            'svc_gv_io': { volumes: { '2026-02': 0.405277, '2026-03': 0.405277, '2026-04': 0.405277, '2026-05': 0.405277, '2026-06': 0.405277, '2026-07': 0.405277 } },
            'svc_xv_io': { volumes: { '2026-02': 0.378076, '2026-03': 0.378076, '2026-04': 0.378076, '2026-05': 0.378076, '2026-06': 0.378076, '2026-07': 0.378076 } },
            'svc_vo_io': { volumes: { '2026-02': 0.783353, '2026-03': 0.783353, '2026-04': 0.783353, '2026-05': 0.783353, '2026-06': 0.783353, '2026-07': 0.783353 } },
            'svc_el_io': { volumes: { '2026-02': 32.0907897, '2026-03': 31.14223, '2026-04': 31.14223, '2026-05': 31.14223, '2026-06': 31.14223, '2026-07': 31.14223 } },
            'svc_tko': { volumes: { '2026-02': 0.174, '2026-03': 0.174, '2026-04': 0.174, '2026-05': 0.174, '2026-06': 0.174, '2026-07': 0.174 } },
            'svc_vo': { volumes: { '2026-02': 8.324, '2026-03': 10.419, '2026-04': 9.097, '2026-05': 9.585, '2026-06': 4.357, '2026-07': 7.368 } },
            'svc_heat_gv': { volumes: { '2026-02': 0.112, '2026-03': 0.117, '2026-04': 0.131, '2026-05': 0.143, '2026-06': 0.088, '2026-07': 0.084 } },
            'svc_heating': { volumes: { '2026-02': 1.742, '2026-03': 1.411, '2026-04': 0.882, '2026-05': 0.547, '2026-06': 0, '2026-07': 0 } }
        };

        const data = serviceData[serviceId];
        if (data && data.volumes[monthStr] !== undefined) {
            return { consumption: data.volumes[monthStr] };
        }
        return { consumption: null };
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
