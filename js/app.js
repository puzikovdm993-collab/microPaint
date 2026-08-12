/**
 * Main Application Module
 * Initializes the app and coordinates all modules
 */

const App = {
    currentMonth: '2026-07', // Default to July 2026
    
    /**
     * Initialize application
     */
    async init() {
        try {
            // Initialize database
            await DB.init();
            
            // Load settings
            await this.loadSettings();
            
            // Check if we need to load demo data
            const hasData = await DB.hasData();
            if (!hasData) {
                await this.loadDemoData();
            }
            
            // Initialize UI components
            UI.initSidebarToggle();
            UI.initNavigation((view) => this.navigate(view));
            UI.initMonthSelector(this.currentMonth, (month) => this.changeMonth(month));
            
            // Initialize theme
            const theme = await DB.getSetting('theme', 'light');
            UI.setTheme(theme);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render initial view
            await this.renderCurrentView();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            UI.showToast('Ошибка инициализации приложения', 'error');
        }
    },

    /**
     * Load user settings
     */
    async loadSettings() {
        const theme = await DB.getSetting('theme', 'light');
        const currency = await DB.getSetting('currency', 'RUB');
        
        // Apply settings
        document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
        
        // Update form values if on settings page
        const themeSelect = document.getElementById('themeSelect');
        const currencySelect = document.getElementById('currencySelect');
        
        if (themeSelect) themeSelect.value = theme;
        if (currencySelect) currencySelect.value = currency;
    },

    /**
     * Navigate to different view
     */
    async navigate(viewName) {
        UI.switchView(viewName);
        
        // Render specific view content
        switch(viewName) {
            case 'dashboard':
                await Dashboard.update(this.currentMonth);
                break;
            case 'accruals':
                await this.renderAccrualsView();
                break;
            case 'meters':
                await this.renderMetersView();
                break;
            case 'tariffs':
                await this.renderTariffsView();
                break;
            case 'analytics':
                await this.renderAnalyticsView();
                break;
            case 'services':
                await this.renderServicesView();
                break;
            case 'import-export':
                // No special rendering needed
                break;
            case 'settings':
                // No special rendering needed
                break;
        }
    },

    /**
     * Change current month
     */
    async changeMonth(month) {
        this.currentMonth = month;
        
        // Update current view
        const activeView = document.querySelector('.view.active');
        if (activeView) {
            const viewName = activeView.id.replace('View', '');
            await this.navigate(viewName);
        }
    },

    /**
     * Render current view based on URL hash or default
     */
    async renderCurrentView() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        await this.navigate(hash);
    },

    /**
     * Render accruals view table
     */
    async renderAccrualsView() {
        const [services, accruals] = await Promise.all([
            ServicesService.getActive(),
            AccrualsService.getAll()
        ]);

        // Get months from data
        const months = [...new Set(accruals.map(a => a.month))].sort();
        const displayMonths = months.length > 0 ? months : ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];

        // Build table
        const tbody = document.getElementById('accrualsTableBody');
        if (!tbody) return;

        let html = '';
        
        // Group services by category
        const categories = {
            water: '💧 Вода',
            electricity: '⚡ Электроэнергия',
            heating: '🔥 Отопление',
            maintenance: '🏠 Содержание',
            waste: '♻ ТКО',
            phone: '☎ Телефон'
        };

        for (const [catId, catName] of Object.entries(categories)) {
            const catServices = services.filter(s => s.category === catId);
            if (catServices.length === 0) continue;

            html += `<tr class="category-header"><td colspan="${displayMonths.length + 3}">${catName}</td></tr>`;

            for (const service of catServices) {
                html += '<tr>';
                html += `<td class="service-col">${service.name}</td>`;
                html += `<td>${service.unit}</td>`;

                for (const month of displayMonths) {
                    const accrual = accruals.find(a => a.serviceId === service.id && a.month === month);
                    if (accrual) {
                        html += `<td class="numeric clickable month-col" data-service="${service.id}" data-month="${month}">`;
                        html += Utils.formatCurrency(accrual.amount);
                        html += '</td>';
                    } else {
                        html += '<td class="numeric">—</td>';
                    }
                }

                // Total
                const serviceAccruals = accruals.filter(a => a.serviceId === service.id);
                const total = Utils.sum(serviceAccruals, a => a.amount);
                html += `<td class="numeric total-col">${total > 0 ? Utils.formatCurrency(total) : '—'}</td>`;
                html += '</tr>';
            }
        }

        tbody.innerHTML = html;

        // Add click handlers to cells
        tbody.querySelectorAll('.clickable').forEach(cell => {
            cell.addEventListener('click', () => {
                const serviceId = cell.dataset.service;
                const month = cell.dataset.month;
                this.showAccrualDetail(serviceId, month);
            });
        });

        // Populate month selector
        const select = document.getElementById('accrualMonthSelect');
        if (select) {
            select.innerHTML = displayMonths.map(m => 
                `<option value="${m}" ${m === this.currentMonth ? 'selected' : ''}>${Utils.formatMonthDisplay(m)}</option>`
            ).join('');
        }
    },

    /**
     * Show accrual detail modal
     */
    async showAccrualDetail(serviceId, month) {
        const [accrual, service, tariff] = await Promise.all([
            AccrualsService.getByServiceAndMonth(serviceId, month),
            ServicesService.getById(serviceId),
            TariffsService.getForServiceAndMonth(serviceId, month)
        ]);

        if (!accrual || !service) {
            UI.showToast('Данные не найдены', 'error');
            return;
        }

        const calculated = accrual.calculatedAmount !== null ? accrual.calculatedAmount : accrual.volume * (tariff?.value || 0);
        const diff = Calculations.calculateDifference(accrual.amount, calculated);

        const content = `
            <div class="detail-grid">
                <div class="form-row">
                    <div class="form-group">
                        <label>Услуга</label>
                        <p><strong>${service.name}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Месяц</label>
                        <p><strong>${Utils.formatMonthDisplay(month)}</strong></p>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Объем</label>
                        <p>${Utils.formatNumber(accrual.volume, 3)} ${service.unit}</p>
                    </div>
                    <div class="form-group">
                        <label>Тариф</label>
                        <p>${Utils.formatNumber(tariff?.value || accrual.tariff, 2)} ₽/${service.unit}</p>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Расчетная сумма</label>
                        <p>${Utils.formatCurrency(calculated)}</p>
                    </div>
                    <div class="form-group">
                        <label>По квитанции</label>
                        <p><strong>${Utils.formatCurrency(accrual.amount)}</strong></p>
                    </div>
                </div>
                <div class="form-group">
                    <label>Разница</label>
                    <p class="${diff.relative >= 0 ? 'positive' : 'negative'}">
                        ${diff.relative >= 0 ? '+' : ''}${Utils.formatCurrency(diff.relative)} (${Utils.formatPercent(diff.percent)})
                    </p>
                </div>
                ${accrual.comment ? `<div class="form-group"><label>Комментарий</label><p>${Utils.escapeHtml(accrual.comment)}</p></div>` : ''}
            </div>
        `;

        UI.showModal(`${service.name} - ${Utils.formatMonthDisplay(month)}`, content, [
            { text: 'Закрыть', onClick: () => {} }
        ]);
    },

    /**
     * Render meters view
     */
    async renderMetersView() {
        const [meters, readings] = await Promise.all([
            MetersService.getAll(),
            ReadingsService.getAll()
        ]);

        // Render meters table
        const metersBody = document.getElementById('metersTableBody');
        if (metersBody) {
            let html = '';
            for (const meter of meters) {
                html += '<tr>';
                html += `<td>${meter.name}</td>`;
                html += `<td>${meter.type}</td>`;
                html += `<td>${meter.unit}</td>`;
                html += `<td>${meter.serialNumber || '—'}</td>`;
                html += `<td><span class="badge ${meter.isActive ? 'badge-success' : 'badge-secondary'}">${meter.isActive ? 'Активен' : 'Не активен'}</span></td>`;
                html += '</tr>';
            }
            metersBody.innerHTML = html || '<tr><td colspan="5" class="empty-state">Нет счетчиков</td></tr>';
        }

        // Render readings table
        const readingsHeader = document.getElementById('readingsHeaderRow');
        const readingsBody = document.getElementById('readingsTableBody');
        
        if (readingsHeader && readingsBody) {
            // Get unique months
            const months = [...new Set(readings.map(r => r.month))].sort();
            
            // Build header
            let headerHtml = '<th>Счетчик</th><th>Ед.</th>';
            months.forEach(month => {
                headerHtml += `<th>${Utils.formatMonth(month)}</th>`;
            });
            readingsHeader.innerHTML = headerHtml;

            // Build body
            let bodyHtml = '';
            for (const meter of meters) {
                const meterReadings = readings.filter(r => r.meterId === meter.id);
                bodyHtml += '<tr>';
                bodyHtml += `<td>${meter.name}</td>`;
                bodyHtml += `<td>${meter.unit}</td>`;
                
                for (const month of months) {
                    const reading = meterReadings.find(r => r.month === month);
                    if (reading) {
                        // Calculate consumption from previous
                        const prevMonth = Utils.addMonths(month, -1);
                        const prevReading = meterReadings.find(r => r.month === prevMonth);
                        const consumption = prevReading ? reading.value - prevReading.value : null;
                        
                        bodyHtml += `<td class="numeric">`;
                        bodyHtml += `<span class="reading-value">${Utils.formatNumber(reading.value, 3)}</span>`;
                        if (consumption !== null && consumption >= 0) {
                            bodyHtml += `<span class="reading-consumption">↓ ${Utils.formatNumber(consumption, 3)}</span>`;
                        }
                        bodyHtml += '</td>';
                    } else {
                        bodyHtml += '<td>—</td>';
                    }
                }
                bodyHtml += '</tr>';
            }
            readingsBody.innerHTML = bodyHtml || '<tr><td colspan="' + (months.length + 2) + '" class="empty-state">Нет показаний</td></tr>';
        }
    },

    /**
     * Render tariffs view
     */
    async renderTariffsView() {
        const [tariffs, services] = await Promise.all([
            TariffsService.getAll(),
            ServicesService.getAll()
        ]);

        const serviceMap = {};
        services.forEach(s => serviceMap[s.id] = s);

        const tbody = document.getElementById('tariffsTableBody');
        if (!tbody) return;

        let html = '';
        for (const tariff of tariffs.sort((a, b) => Utils.compareMonths(b.validFrom, a.validFrom))) {
            const service = serviceMap[tariff.serviceId];
            html += '<tr>';
            html += `<td>${service ? service.name : tariff.serviceId}</td>`;
            html += `<td>${Utils.formatCurrency(tariff.value)}</td>`;
            html += `<td>${tariff.unit}</td>`;
            html += `<td>${Utils.formatMonth(tariff.validFrom)}</td>`;
            html += `<td>${tariff.validTo ? Utils.formatMonth(tariff.validTo) : '—'}</td>`;
            html += `<td>
                <div class="action-buttons">
                    <button class="action-btn delete" onclick="App.deleteTariff('${tariff.id}')">🗑️</button>
                </div>
            </td>`;
            html += '</tr>';
        }
        tbody.innerHTML = html || '<tr><td colspan="6" class="empty-state">Нет тарифов</td></tr>';
    },

    /**
     * Delete tariff
     */
    async deleteTariff(id) {
        if (await UI.confirm('Удалить этот тариф?', 'Подтверждение')) {
            await TariffsService.delete(id);
            UI.showToast('Тариф удален', 'success');
            await this.renderTariffsView();
        }
    },

    /**
     * Render analytics view
     */
    async renderAnalyticsView() {
        // Water consumption chart
        const waterData = await AnalyticsService.getWaterConsumptionData(6);
        AnalyticsService.renderLineChart('waterConsumptionChart', waterData);

        // Electricity chart
        const elecData = await AnalyticsService.getElectricityData(6);
        AnalyticsService.renderLineChart('electricityConsumptionChart', elecData);

        // Amount trend
        const amountData = await AnalyticsService.getAmountTrendData(6);
        AnalyticsService.renderLineChart('amountTrendChart', amountData);

        // Category pie
        const categoryData = await AnalyticsService.getCategoryData();
        AnalyticsService.renderPieChart('categoryPieChart', categoryData);

        // Comparison chart
        const comparisonData = await AnalyticsService.getComparisonData(6);
        AnalyticsService.renderLineChart('comparisonChart', comparisonData);
    },

    /**
     * Render services view
     */
    async renderServicesView() {
        const services = await ServicesService.getAll();
        
        const tbody = document.getElementById('servicesTableBody');
        if (!tbody) return;

        const categories = {
            water: 'Вода',
            electricity: 'Электричество',
            heating: 'Отопление',
            maintenance: 'Содержание',
            waste: 'ТКО',
            phone: 'Телефон',
            other: 'Прочее'
        };

        let html = '';
        for (const service of services) {
            html += '<tr>';
            html += `<td>${service.name}</td>`;
            html += `<td>${service.shortName || '—'}</td>`;
            html += `<td>${categories[service.category] || service.category}</td>`;
            html += `<td>${service.unit}</td>`;
            html += `<td>${service.meterId ? '✅' : '—'}</td>`;
            html += `<td><span class="badge ${service.isActive ? 'badge-success' : 'badge-secondary'}">${service.isActive ? 'Да' : 'Нет'}</span></td>`;
            html += `<td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="App.editService('${service.id}')">✏️</button>
                    <button class="action-btn delete" onclick="App.toggleService('${service.id}')">${service.isActive ? '🚫' : '✅'}</button>
                </div>
            </td>`;
            html += '</tr>';
        }
        tbody.innerHTML = html || '<tr><td colspan="7" class="empty-state">Нет услуг</td></tr>';
    },

    /**
     * Edit service (placeholder)
     */
    async editService(id) {
        UI.showToast('Редактирование услуги будет доступно в следующей версии', 'info');
    },

    /**
     * Toggle service active status
     */
    async toggleService(id) {
        await ServicesService.toggleActive(id);
        UI.showToast('Статус услуги изменен', 'success');
        await this.renderServicesView();
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeSwitch')?.addEventListener('change', (e) => {
            UI.setTheme(e.target.checked ? 'dark' : 'light');
            UI.showToast('Тема сохранена', 'success');
        });

        // Save settings button
        document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
            const theme = document.getElementById('themeSelect')?.value;
            const currency = document.getElementById('currencySelect')?.value;
            
            if (theme) await DB.setSetting('theme', theme);
            if (currency) await DB.setSetting('currency', currency);
            
            UI.setTheme(theme);
            UI.showToast('Настройки сохранены', 'success');
        });

        // Clear all data button
        document.getElementById('clearAllDataBtn')?.addEventListener('click', async () => {
            if (await UI.confirm('Вы уверены? Все данные будут удалены без возможности восстановления!', 'Очистка всех данных')) {
                await DB.clearAll();
                UI.showToast('Все данные удалены. Перезагрузите страницу.', 'warning', 5000);
            }
        });

        // Export buttons
        document.getElementById('exportJsonBtn')?.addEventListener('click', async () => {
            await ImportExportService.exportJSON();
            UI.showToast('Данные экспортированы в JSON', 'success');
        });

        document.getElementById('exportCsvBtn')?.addEventListener('click', async () => {
            await ImportExportService.exportCSV();
            UI.showToast('Данные экспортированы в CSV', 'success');
        });

        document.getElementById('exportReportBtn')?.addEventListener('click', async () => {
            const startMonth = '2026-02';
            const endMonth = this.currentMonth;
            await ImportExportService.exportReport(startMonth, endMonth);
            UI.showToast('Отчет экспортирован', 'success');
        });

        // Import button
        document.getElementById('importBtn')?.addEventListener('click', async () => {
            const fileInput = document.getElementById('importFile');
            const file = fileInput?.files?.[0];
            
            if (!file) {
                UI.showToast('Выберите файл для импорта', 'warning');
                return;
            }

            try {
                const content = await Utils.readFileAsText(file);
                let stats;
                
                if (file.name.endsWith('.json')) {
                    stats = await ImportExportService.importJSON(content);
                } else {
                    stats = await ImportExportService.importCSV(content);
                }

                UI.showToast(`Импортировано: услуги=${stats.services}, счетчики=${stats.meters}, показания=${stats.readings}, тарифы=${stats.tariffs}, начисления=${stats.accruals}`, 'success', 5000);
                await this.navigate('dashboard');
            } catch (error) {
                UI.showToast('Ошибка импорта: ' + error.message, 'error');
            }
        });

        // Demo data buttons
        document.getElementById('loadDemoDataBtn')?.addEventListener('click', async () => {
            if (await UI.confirm('Загрузить демонстрационные данные? Текущие данные будут дополнены.', 'Демо-данные')) {
                await this.loadDemoData();
                UI.showToast('Демо-данные загружены', 'success');
                await this.navigate('dashboard');
            }
        });

        document.getElementById('clearDemoDataBtn')?.addEventListener('click', async () => {
            if (await UI.confirm('Удалить демонстрационные данные?', 'Очистка демо-данных')) {
                // Clear demo data but keep user data structure
                await DB.clear(DB.STORES.ACCRUALS);
                await DB.clear(DB.STORES.METER_READINGS);
                await DB.clear(DB.STORES.TARIFFS);
                UI.showToast('Демо-данные удалены', 'success');
                await this.navigate('dashboard');
            }
        });

        // Copy previous month button
        document.getElementById('copyPreviousMonthBtn')?.addEventListener('click', async () => {
            const select = document.getElementById('accrualMonthSelect');
            const targetMonth = select?.value;
            
            if (!targetMonth) {
                UI.showToast('Выберите месяц', 'warning');
                return;
            }

            const prevMonth = Utils.addMonths(targetMonth, -1);
            
            try {
                const count = await AccrualsService.copyMonth(prevMonth, targetMonth);
                UI.showToast(`Скопировано ${count} начислений из ${Utils.formatMonth(prevMonth)}`, 'success');
                await this.renderAccrualsView();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            this.renderCurrentView();
        });
    },

    /**
     * Load demo data from provided specification
     */
    async loadDemoData() {
        // Initialize default services
        await ServicesService.initDefaults();
        
        // Initialize default meters
        await MetersService.initDefaults();

        // Create tariffs based on the data
        const tariffs = [
            // Housing
            { serviceId: 'housing', value: 43.42, unit: 'м²', validFrom: '2026-02', validTo: null },
            { serviceId: 'housing-io', value: 43.42, unit: 'м²', validFrom: '2026-02', validTo: null },
            
            // Hot water IO
            { serviceId: 'gv-io', value: 126.04, unit: 'м³', validFrom: '2026-02', validTo: null },
            
            // Cold water IO
            { serviceId: 'hv-io', value: 29.86, unit: 'м³', validFrom: '2026-02', validTo: null },
            
            // Drainage IO
            { serviceId: 'vo-io', value: 37.19, unit: 'м³', validFrom: '2026-02', validTo: null },
            
            // Electricity IO
            { serviceId: 'el-io', value: 3.39, unit: 'кВт·ч', validFrom: '2026-02', validTo: null },
            
            // TKO
            { serviceId: 'tko', value: 552.61, unit: 'м³', validFrom: '2026-02', validTo: null },
            
            // Drainage (ВО)
            { serviceId: 'vo', value: 37.19, unit: 'м³', validFrom: '2026-02', validTo: null },
            
            // Cold water (ХВ)
            { serviceId: 'hv', value: 29.58, unit: 'м³', validFrom: '2026-02', validTo: '2026-04' },
            { serviceId: 'hv', value: 29.58, unit: 'м³', validFrom: '2026-05', validTo: null },
            
            // Cold water for hot water (ХВ для ГВ)
            { serviceId: 'hv-gv', value: 29.58, unit: 'м³', validFrom: '2026-02', validTo: '2026-04' },
            { serviceId: 'hv-gv', value: 30.98, unit: 'м³', validFrom: '2026-05', validTo: '2026-05' },
            { serviceId: 'hv-gv', value: 31.71, unit: 'м³', validFrom: '2026-06', validTo: null },
            
            // Heat energy for hot water
            { serviceId: 'heat-gv', value: 2021.2, unit: 'Гкал', validFrom: '2026-02', validTo: null },
            
            // Heating
            { serviceId: 'heating', value: 2021.2, unit: 'Гкал', validFrom: '2026-02', validTo: null },
            
            // Phone
            { serviceId: 'phone', value: 358, unit: 'усл.ед', validFrom: '2026-07', validTo: null },
            
            // Electricity
            { serviceId: 'el', value: 3.39, unit: 'кВт·ч', validFrom: '2026-02', validTo: null }
        ];

        for (const t of tariffs) {
            await TariffsService.create(t);
        }

        // Create meter readings
        const readings = [
            // Electricity
            { meterId: 'el-meter', month: '2026-02', value: 8 },
            { meterId: 'el-meter', month: '2026-03', value: 513 },
            { meterId: 'el-meter', month: '2026-04', value: 651 },
            { meterId: 'el-meter', month: '2026-05', value: 821 },
            { meterId: 'el-meter', month: '2026-06', value: 898 },
            
            // Cold water
            { meterId: 'hv-meter', month: '2026-02', value: 15.754 },
            { meterId: 'hv-meter', month: '2026-03', value: 23.664 },
            { meterId: 'hv-meter', month: '2026-04', value: 29.951 },
            { meterId: 'hv-meter', month: '2026-05', value: 36.469 },
            { meterId: 'hv-meter', month: '2026-06', value: 28.949 },
            { meterId: 'hv-meter', month: '2026-07', value: 42.04 },
            
            // Hot water
            { meterId: 'gv-meter', month: '2026-02', value: 6.95 },
            { meterId: 'gv-meter', month: '2026-03', value: 9.459 },
            { meterId: 'gv-meter', month: '2026-04', value: 12.269 },
            { meterId: 'gv-meter', month: '2026-05', value: 15.336 },
            { meterId: 'gv-meter', month: '2026-06', value: 17.213 },
            { meterId: 'gv-meter', month: '2026-07', value: 19.01 }
        ];

        for (const r of readings) {
            await ReadingsService.create(r);
        }

        // Create accruals based on provided data
        const accruals = [
            // Housing (Содержание жилья)
            { serviceId: 'housing', month: '2026-03', volume: 59.2, tariff: 43.42, amount: 2570.46 },
            { serviceId: 'housing', month: '2026-04', volume: 59.2, tariff: 43.42, amount: 2570.46 },
            { serviceId: 'housing', month: '2026-05', volume: 59.2, tariff: 43.42, amount: 2570.46 },
            { serviceId: 'housing', month: '2026-06', volume: 59.2, tariff: 43.42, amount: 2570.46 },
            { serviceId: 'housing', month: '2026-07', volume: 59.2, tariff: 43.42, amount: 2570.46 },

            // Hot water IO (ГВ ИО)
            { serviceId: 'gv-io', month: '2026-03', volume: 0.405277, tariff: 126.04, amount: 51.08 },
            { serviceId: 'gv-io', month: '2026-04', volume: 0.405277, tariff: 126.04, amount: 51.08 },
            { serviceId: 'gv-io', month: '2026-05', volume: 0.405277, tariff: 126.04, amount: 51.08 },
            { serviceId: 'gv-io', month: '2026-06', volume: 0.405277, tariff: 126.04, amount: 51.08 },
            { serviceId: 'gv-io', month: '2026-07', volume: 0.405277, tariff: 126.04, amount: 51.08 },

            // Cold water IO (ХВ ИО)
            { serviceId: 'hv-io', month: '2026-03', volume: 0.378076, tariff: 29.86, amount: 11.29 },
            { serviceId: 'hv-io', month: '2026-04', volume: 0.378076, tariff: 29.86, amount: 11.29 },
            { serviceId: 'hv-io', month: '2026-05', volume: 0.378076, tariff: 29.86, amount: 11.29 },
            { serviceId: 'hv-io', month: '2026-06', volume: 0.378076, tariff: 29.86, amount: 11.29 },
            { serviceId: 'hv-io', month: '2026-07', volume: 0.378076, tariff: 29.86, amount: 11.29 },

            // Drainage IO (ВО ИО)
            { serviceId: 'vo-io', month: '2026-03', volume: 0.783353, tariff: 37.19, amount: 29.13 },
            { serviceId: 'vo-io', month: '2026-04', volume: 0.783353, tariff: 37.19, amount: 29.13 },
            { serviceId: 'vo-io', month: '2026-05', volume: 0.783353, tariff: 37.19, amount: 29.13 },
            { serviceId: 'vo-io', month: '2026-06', volume: 0.783353, tariff: 37.19, amount: 29.13 },
            { serviceId: 'vo-io', month: '2026-07', volume: 0.783353, tariff: 37.19, amount: 29.13 },

            // Electricity IO (Эл ИО)
            { serviceId: 'el-io', month: '2026-03', volume: 32.0907897, tariff: 3.39, amount: 111.56 },
            { serviceId: 'el-io', month: '2026-04', volume: 31.14223, tariff: 3.39, amount: 105.57 },
            { serviceId: 'el-io', month: '2026-05', volume: 31.14223, tariff: 3.39, amount: 105.57 },
            { serviceId: 'el-io', month: '2026-06', volume: 31.14223, tariff: 3.39, amount: 105.57 },
            { serviceId: 'el-io', month: '2026-07', volume: 31.14223, tariff: 3.39, amount: 105.57 },

            // TKO
            { serviceId: 'tko', month: '2026-03', volume: 0.174, tariff: 552.61, amount: 96.15 },
            { serviceId: 'tko', month: '2026-04', volume: 0.174, tariff: 552.61, amount: 96.15 },
            { serviceId: 'tko', month: '2026-05', volume: 0.174, tariff: 552.61, amount: 96.15 },
            { serviceId: 'tko', month: '2026-06', volume: 0.174, tariff: 552.61, amount: 96.15 },
            { serviceId: 'tko', month: '2026-07', volume: 0.174, tariff: 552.61, amount: 96.15 },

            // Drainage (ВО)
            { serviceId: 'vo', month: '2026-02', volume: 8.324, tariff: 37.19, amount: 309.57 },
            { serviceId: 'vo', month: '2026-03', volume: 10.419, tariff: 37.19, amount: 387.48 },
            { serviceId: 'vo', month: '2026-04', volume: 9.097, tariff: 37.19, amount: 338.31 },
            { serviceId: 'vo', month: '2026-05', volume: 9.585, tariff: 37.19, amount: 356.46 },
            { serviceId: 'vo', month: '2026-06', volume: 4.357, tariff: 37.19, amount: 162.04 },
            { serviceId: 'vo', month: '2026-07', volume: 7.368, tariff: 37.19, amount: 274.02 },

            // Cold water (ХВ)
            { serviceId: 'hv', month: '2026-02', volume: 5.924, tariff: 29.58, amount: 176.83 },
            { serviceId: 'hv', month: '2026-03', volume: 7.91, tariff: 29.58, amount: 236.11 },
            { serviceId: 'hv', month: '2026-04', volume: 6.287, tariff: 29.58, amount: 187.67 },
            { serviceId: 'hv', month: '2026-05', volume: 6.518, tariff: 29.58, amount: 194.56 },
            { serviceId: 'hv', month: '2026-06', volume: 2.48, tariff: 29.58, amount: 74.03 },
            { serviceId: 'hv', month: '2026-07', volume: 5.571, tariff: 29.58, amount: 166.29 },

            // Cold water for hot water (ХВ для ГВ)
            { serviceId: 'hv-gv', month: '2026-02', volume: 2.4, tariff: 29.58, amount: 71.64 },
            { serviceId: 'hv-gv', month: '2026-03', volume: 2.509, tariff: 29.58, amount: 74.89 },
            { serviceId: 'hv-gv', month: '2026-04', volume: 2.81, tariff: 29.58, amount: 83.88 },
            { serviceId: 'hv-gv', month: '2026-05', volume: 3.067, tariff: 30.98, amount: 95.04 },
            { serviceId: 'hv-gv', month: '2026-06', volume: 1.877, tariff: 31.71, amount: 59.52 },
            { serviceId: 'hv-gv', month: '2026-07', volume: 1.797, tariff: 31.71, amount: 56.98 },

            // Heat energy for hot water (Теплоэнергия для ГВ)
            { serviceId: 'heat-gv', month: '2026-02', volume: 0.112, tariff: 2021.2, amount: 226.37 },
            { serviceId: 'heat-gv', month: '2026-03', volume: 0.117, tariff: 2021.2, amount: 236.48 },
            { serviceId: 'heat-gv', month: '2026-04', volume: 0.131, tariff: 2021.2, amount: 264.78 },
            { serviceId: 'heat-gv', month: '2026-05', volume: 0.143, tariff: 2021.2, amount: 298.04 },
            { serviceId: 'heat-gv', month: '2026-06', volume: 0.088, tariff: 2021.2, amount: 177.87 },
            { serviceId: 'heat-gv', month: '2026-07', volume: 0.084, tariff: 2021.2, amount: 169.78 },

            // Heating (Отопление)
            { serviceId: 'heating', month: '2026-02', volume: 1.742, tariff: 2021.2, amount: 3520.93 },
            { serviceId: 'heating', month: '2026-03', volume: 1.411, tariff: 2021.2, amount: 2851.91 },
            { serviceId: 'heating', month: '2026-04', volume: 0.882, tariff: 2021.2, amount: 1782.70 },
            { serviceId: 'heating', month: '2026-05', volume: 0.547, tariff: 2021.2, amount: 1105.60 },

            // Phone (Телефон)
            { serviceId: 'phone', month: '2026-07', volume: 0.935, tariff: 358, amount: 334.90 },

            // Electricity (Эл)
            { serviceId: 'el', month: '2026-03', volume: 505, tariff: 3.39, amount: 1711.95 },
            { serviceId: 'el', month: '2026-04', volume: 651, tariff: 3.39, amount: 467.82 },
            { serviceId: 'el', month: '2026-05', volume: 821, tariff: 3.39, amount: 576.30 },
            { serviceId: 'el', month: '2026-06', volume: 898, tariff: 3.39, amount: 261.03 }
        ];

        for (const a of accruals) {
            await AccrualsService.create(a);
        }

        console.log('Demo data loaded successfully');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for use in HTML onclick handlers
if (typeof window !== 'undefined') {
    window.App = App;
}
