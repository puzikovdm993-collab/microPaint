/**
 * Компонент графиков (Chart.js wrapper)
 */

const ChartComponent = {
    charts: {},

    /**
     * Создание графика расходов по месяцам
     */
    createExpenseChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        // Уничтожаем предыдущий график
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Расходы',
                    data: data.values,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return Utils.formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => Utils.formatCurrency(value)
                        }
                    }
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Создание графика расходов по категориям
     */
    createCategoryChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444', 
            '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'
        ];

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: colors.slice(0, data.labels.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = ((value / total) * 100).toFixed(1);
                                return `${Utils.formatCurrency(value)} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Создание комбинированного графика по услугам
     */
    createMultiLineChart(canvasId, categoriesData, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444', 
            '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'
        ];

        const labels = Object.values(categoriesData)[0]?.map(d => d.label) || [];
        
        const datasets = Object.entries(categoriesData).map(([category, data], index) => ({
            label: category,
            data: data.map(d => d.value),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length],
            tension: 0.4,
            fill: false
        }));

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => Utils.formatCurrency(value)
                        }
                    }
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Создание столбчатого графика потребления
     */
    createBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label || 'Потребление',
                    data: data.values,
                    backgroundColor: '#4f46e5',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.raw} ${data.unit || ''}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `${value} ${data.unit || ''}`
                        }
                    }
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Обновление данных графика
     */
    updateChart(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (chart && newData) {
            if (newData.labels) {
                chart.data.labels = newData.labels;
            }
            if (newData.datasets) {
                chart.data.datasets = newData.datasets;
            }
            chart.update();
        }
    },

    /**
     * Уничтожение графика
     */
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
};
