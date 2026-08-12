/**
 * Analytics Module
 * Data analysis, charts, and reporting functionality
 */

const AnalyticsService = {
    /**
     * Get data for water consumption chart
     */
    async getWaterConsumptionData(months = 6) {
        const services = await ServicesService.getAll();
        const waterServices = services.filter(s => 
            s.category === Models.CATEGORIES.WATER && s.isMetered
        );

        const result = {
            labels: [],
            datasets: []
        };

        // Get latest months
        const allReadings = await ReadingsService.getAll();
        if (allReadings.length === 0) return result;

        // Get unique months sorted
        const allMonths = [...new Set(allReadings.map(r => r.month))]
            .sort()
            .slice(-months);

        result.labels = allMonths.map(m => Utils.getShortMonthName(m.split('-')[1]));

        for (const service of waterServices) {
            const meterReadings = await ReadingsService.getByMeterId(service.meterId);
            const readingsWithConsumption = await ReadingsService.getReadingsWithConsumption(service.meterId);

            const data = allMonths.map(month => {
                const reading = readingsWithConsumption.find(r => r.month === month);
                return reading ? reading.consumption : null;
            });

            result.datasets.push({
                label: service.shortName || service.name,
                data: data,
                borderColor: this.getColorForService(service.id),
                backgroundColor: this.getColorForService(service.id, 0.3),
                tension: 0.3,
                fill: false
            });
        }

        return result;
    },

    /**
     * Get data for electricity consumption chart
     */
    async getElectricityData(months = 6) {
        const services = await ServicesService.getAll();
        const electricityServices = services.filter(s => 
            s.category === Models.CATEGORIES.ELECTRICITY
        );

        const result = {
            labels: [],
            datasets: []
        };

        const allAccruals = await AccrualsService.getAll();
        if (allAccruals.length === 0) return result;

        const allMonths = [...new Set(allAccruals.map(a => a.month))]
            .sort()
            .slice(-months);

        result.labels = allMonths.map(m => Utils.getShortMonthName(m.split('-')[1]));

        for (const service of electricityServices) {
            const serviceAccruals = await AccrualsService.getByServiceId(service.id);
            
            const data = allMonths.map(month => {
                const accrual = serviceAccruals.find(a => a.month === month);
                return accrual ? accrual.volume : null;
            });

            result.datasets.push({
                label: service.shortName || service.name,
                data: data,
                borderColor: this.getColorForService(service.id),
                backgroundColor: this.getColorForService(service.id, 0.3),
                tension: 0.3,
                fill: false
            });
        }

        return result;
    },

    /**
     * Get data for amount trend chart
     */
    async getAmountTrendData(months = 6) {
        const result = {
            labels: [],
            datasets: [{
                label: 'Сумма начислений (₽)',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.3)',
                tension: 0.3,
                fill: true
            }]
        };

        const allAccruals = await AccrualsService.getAll();
        if (allAccruals.length === 0) return result;

        const allMonths = [...new Set(allAccruals.map(a => a.month))]
            .sort()
            .slice(-months);

        result.labels = allMonths.map(m => Utils.formatMonth(m));

        for (const month of allMonths) {
            const monthAccruals = allAccruals.filter(a => a.month === month);
            const total = Utils.sum(monthAccruals, a => a.amount);
            result.datasets[0].data.push(total);
        }

        return result;
    },

    /**
     * Get data for category pie chart
     */
    async getCategoryData(month = null) {
        const totals = month 
            ? await AccrualsService.getTotalsByCategory(month)
            : await this.getTotalByCategory();

        const categories = {
            water: { label: 'Вода', color: '#3498db' },
            electricity: { label: 'Электроэнергия', color: '#f1c40f' },
            heating: { label: 'Отопление', color: '#e74c3c' },
            maintenance: { label: 'Содержание', color: '#9b59b6' },
            waste: { label: 'ТКО', color: '#27ae60' },
            phone: { label: 'Телефон', color: '#1abc9c' },
            other: { label: 'Прочее', color: '#95a5a6' }
        };

        const data = [];
        const labels = [];
        const colors = [];

        for (const [key, value] of Object.entries(totals)) {
            if (key !== 'total' && value > 0) {
                labels.push(categories[key]?.label || key);
                data.push(value);
                colors.push(categories[key]?.color || '#95a5a6');
            }
        }

        return { labels, data, colors };
    },

    /**
     * Get data for comparison chart (calculated vs actual)
     */
    async getComparisonData(months = 6) {
        const result = {
            labels: [],
            datasets: [
                {
                    label: 'Расчетное',
                    data: [],
                    backgroundColor: '#3498db'
                },
                {
                    label: 'Фактическое',
                    data: [],
                    backgroundColor: '#27ae60'
                }
            ]
        };

        const allAccruals = await AccrualsService.getAll();
        const withCalculated = allAccruals.filter(a => a.calculatedAmount !== null);

        if (withCalculated.length === 0) return result;

        const allMonths = [...new Set(withCalculated.map(a => a.month))]
            .sort()
            .slice(-months);

        result.labels = allMonths.map(m => Utils.formatMonth(m));

        for (const month of allMonths) {
            const monthAccruals = withCalculated.filter(a => a.month === month);
            const calculatedTotal = Utils.sum(monthAccruals, a => a.calculatedAmount);
            const actualTotal = Utils.sum(monthAccruals, a => a.amount);
            
            result.datasets[0].data.push(calculatedTotal);
            result.datasets[1].data.push(actualTotal);
        }

        return result;
    },

    /**
     * Get total by category across all months
     */
    async getTotalByCategory() {
        const [accruals, services] = await Promise.all([
            AccrualsService.getAll(),
            ServicesService.getAll()
        ]);

        return Calculations.calculateTotalsByCategory(accruals, services);
    },

    /**
     * Get all anomalies
     */
    async getAnomalies() {
        const anomalies = [];

        // Get consumption anomalies
        const meters = await MetersService.getActive();
        for (const meter of meters) {
            const readings = await ReadingsService.getReadingsWithConsumption(meter.id);
            const service = await ServicesService.getAll();
            const meterService = service.find(s => s.meterId === meter.id);
            
            const readingsWithService = readings.map(r => ({
                ...r,
                serviceName: meterService ? meterService.shortName : ''
            }));

            const consumptionAnomalies = Calculations.detectAnomalies(readingsWithService);
            anomalies.push(...consumptionAnomalies);
        }

        // Get tariff changes
        const services = await ServicesService.getAll();
        for (const service of services) {
            const tariffChanges = await TariffsService.getTariffChanges(
                service.id, 
                service.shortName || service.name
            );
            anomalies.push(...tariffChanges);
        }

        // Get discrepancies
        const discrepancies = await AccrualsService.detectDiscrepancies();
        anomalies.push(...discrepancies);

        // Sort by severity (errors first)
        return anomalies.sort((a, b) => {
            const severity = { error: 0, warning: 1, info: 2 };
            return (severity[a.type] || 3) - (severity[b.type] || 3);
        });
    },

    /**
     * Get month-over-month comparison
     */
    async getMonthComparison(currentMonth, previousMonth) {
        const [currentAccruals, previousAccruals] = await Promise.all([
            AccrualsService.getByMonth(currentMonth),
            AccrualsService.getByMonth(previousMonth)
        ]);

        const currentTotal = Utils.sum(currentAccruals, a => a.amount);
        const previousTotal = Utils.sum(previousAccruals, a => a.amount);

        const change = Utils.calculatePercentChange(currentTotal, previousTotal);

        return {
            currentMonth,
            previousMonth,
            currentTotal,
            previousTotal,
            change,
            difference: currentTotal - previousTotal
        };
    },

    /**
     * Get service color for charts
     */
    getColorForService(serviceId) {
        const colors = {
            'hv': '#3498db',
            'gv': '#e74c3c',
            'vo': '#27ae60',
            'el': '#f1c40f',
            'heating': '#e67e22',
            'housing': '#9b59b6',
            'tko': '#1abc9c',
            'phone': '#34495e'
        };
        return colors[serviceId] || '#95a5a6';
    },

    /**
     * Render line chart using SVG
     */
    renderLineChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container || !data.labels || data.labels.length === 0) {
            if (container) container.innerHTML = '<div class="empty-state">Нет данных для отображения</div>';
            return;
        }

        const width = container.clientWidth || 400;
        const height = container.clientHeight || 250;
        const padding = 40;

        const allValues = data.datasets.flatMap(d => d.data.filter(v => v !== null));
        if (allValues.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет данных</div>';
            return;
        }

        const maxValue = Math.max(...allValues) * 1.1;
        const minValue = Math.min(0, Math.min(...allValues));

        const xStep = (width - padding * 2) / (data.labels.length - 1 || 1);
        const yScale = (height - padding * 2) / (maxValue - minValue || 1);

        let svg = `<svg viewBox="0 0 ${width} ${height}" class="chart-svg">`;
        
        // Grid lines
        svg += '<g class="chart-grid">';
        for (let i = 0; i <= 4; i++) {
            const y = padding + (height - padding * 2) * i / 4;
            const value = maxValue - (maxValue - minValue) * i / 4;
            svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="4"/>`;
            svg += `<text x="${padding - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--text-muted)">${value.toFixed(0)}</text>`;
        }
        svg += '</g>';

        // X-axis labels
        svg += '<g class="chart-labels">';
        data.labels.forEach((label, i) => {
            const x = padding + i * xStep;
            svg += `<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${label}</text>`;
        });
        svg += '</g>';

        // Lines
        data.datasets.forEach((dataset, di) => {
            const points = dataset.data.map((v, i) => {
                if (v === null) return null;
                const x = padding + i * xStep;
                const y = padding + (maxValue - v) * yScale;
                return `${x},${y}`;
            }).filter(p => p !== null);

            if (points.length > 1) {
                const pathD = points.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(' ');
                svg += `<path d="${pathD}" fill="none" stroke="${dataset.borderColor}" stroke-width="2"/>`;
            }

            // Points
            dataset.data.forEach((v, i) => {
                if (v !== null) {
                    const x = padding + i * xStep;
                    const y = padding + (maxValue - v) * yScale;
                    svg += `<circle cx="${x}" cy="${y}" r="4" fill="${dataset.borderColor}"/>`;
                }
            });
        });

        // Legend
        let legendY = 20;
        data.datasets.forEach((dataset, i) => {
            const x = padding + i * 150;
            svg += `<rect x="${x}" y="${legendY - 10}" width="12" height="12" fill="${dataset.borderColor}"/>`;
            svg += `<text x="${x + 16}" y="${legendY}" font-size="11" fill="var(--text-primary)">${dataset.label}</text>`;
        });

        svg += '</svg>';
        container.innerHTML = svg;
    },

    /**
     * Render pie chart using SVG
     */
    renderPieChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container || !data.data || data.data.length === 0) {
            if (container) container.innerHTML = '<div class="empty-state">Нет данных</div>';
            return;
        }

        const size = Math.min(container.clientWidth || 300, container.clientHeight || 250);
        const center = size / 2;
        const radius = size / 2 - 40;

        const total = data.data.reduce((a, b) => a + b, 0);
        let currentAngle = -90;

        let svg = `<svg viewBox="0 0 ${size} ${size}" class="chart-svg">`;
        svg += `<g transform="translate(${center}, ${center})">`;

        const segments = [];
        data.data.forEach((value, i) => {
            const angle = (value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = Math.cos(startRad) * radius;
            const y1 = Math.sin(startRad) * radius;
            const x2 = Math.cos(endRad) * radius;
            const y2 = Math.sin(endRad) * radius;

            const largeArc = angle > 180 ? 1 : 0;

            const pathD = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            segments.push({
                path: pathD,
                color: data.colors[i],
                label: data.labels[i],
                value: value,
                percent: ((value / total) * 100).toFixed(1)
            });

            currentAngle = endAngle;
        });

        segments.forEach(seg => {
            svg += `<path d="${seg.path}" fill="${seg.color}" stroke="var(--bg-secondary)" stroke-width="2"/>`;
        });

        svg += '</g>';

        // Legend
        let legendY = size - 20;
        data.labels.forEach((label, i) => {
            const x = 10 + (i % 3) * (size / 3);
            const y = size - 25 + Math.floor(i / 3) * 20;
            svg += `<rect x="${x}" y="${y}" width="12" height="12" fill="${data.colors[i]}"/>`;
            svg += `<text x="${x + 16}" y="${y + 10}" font-size="10" fill="var(--text-primary)">${label}: ${segments[i].percent}%</text>`;
        });

        svg += '</svg>';
        container.innerHTML = svg;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsService;
}
