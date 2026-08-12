/**
 * Import/Export Module
 * Handle data import and export operations
 */

const ImportExportService = {
    /**
     * Export all data as JSON
     */
    async exportJSON() {
        const data = await DB.exportAll();
        const json = JSON.stringify(data, null, 2);
        const filename = `communal_export_${new Date().toISOString().split('T')[0]}.json`;
        Utils.downloadFile(filename, json, 'application/json');
        return data;
    },

    /**
     * Export data as CSV
     */
    async exportCSV() {
        const [services, meters, readings, tariffs, accruals] = await Promise.all([
            DB.getAll(DB.STORES.SERVICES),
            DB.getAll(DB.STORES.METERS),
            DB.getAll(DB.STORES.METER_READINGS),
            DB.getAll(DB.STORES.TARIFFS),
            DB.getAll(DB.STORES.ACCRUALS)
        ]);

        const csvParts = [];

        // Services CSV
        csvParts.push('=== SERVICES ===');
        csvParts.push('id,name,shortName,category,unit,meterId,isMetered,isActive');
        services.forEach(s => {
            csvParts.push(`${s.id},"${s.name}","${s.shortName || ''}",${s.category},${s.unit},${s.meterId || ''},${s.isMetered},${s.isActive}`);
        });

        // Meters CSV
        csvParts.push('\n=== METERS ===');
        csvParts.push('id,name,type,unit,serialNumber,installationDate,initialValue,isActive');
        meters.forEach(m => {
            csvParts.push(`${m.id},"${m.name}",${m.type},${m.unit},"${m.serialNumber || ''}",${m.installationDate || ''},${m.initialValue},${m.isActive}`);
        });

        // Readings CSV
        csvParts.push('\n=== METER READINGS ===');
        csvParts.push('id,meterId,month,value,comment');
        readings.forEach(r => {
            csvParts.push(`${r.id},${r.meterId},${r.month},${r.value},"${r.comment || ''}"`);
        });

        // Tariffs CSV
        csvParts.push('\n=== TARIFFS ===');
        csvParts.push('id,serviceId,value,unit,validFrom,validTo');
        tariffs.forEach(t => {
            csvParts.push(`${t.id},${t.serviceId},${t.value},${t.unit},${t.validFrom},${t.validTo || ''}`);
        });

        // Accruals CSV
        csvParts.push('\n=== ACCRUALS ===');
        csvParts.push('id,serviceId,month,volume,tariff,amount,calculatedAmount,source,comment');
        accruals.forEach(a => {
            csvParts.push(`${a.id},${a.serviceId},${a.month},${a.volume},${a.tariff},${a.amount},${a.calculatedAmount || ''},${a.source},"${a.comment || ''}"`);
        });

        const csv = csvParts.join('\n');
        const filename = `communal_export_${new Date().toISOString().split('T')[0]}.csv`;
        Utils.downloadFile(filename, csv, 'text/csv');
        return csv;
    },

    /**
     * Export report for specific period
     */
    async exportReport(startMonth, endMonth) {
        const months = Utils.getMonthsRange(startMonth, endMonth);
        const [services, accruals, readings] = await Promise.all([
            ServicesService.getAll(),
            AccrualsService.getAll(),
            ReadingsService.getAll()
        ]);

        const report = {
            generatedAt: new Date().toISOString(),
            period: { start: startMonth, end: endMonth },
            summary: {},
            monthly: [],
            services: services.map(s => ({ id: s.id, name: s.name, shortName: s.shortName }))
        };

        // Calculate monthly totals
        for (const month of months) {
            const monthAccruals = accruals.filter(a => a.month === month);
            const total = Utils.sum(monthAccruals, a => a.amount);
            
            const totals = Calculations.calculateTotalsByCategory(monthAccruals, services);
            
            report.monthly.push({
                month,
                total,
                byCategory: totals
            });

            report.summary[month] = {
                total,
                serviceCount: monthAccruals.length
            };
        }

        const json = JSON.stringify(report, null, 2);
        const filename = `communal_report_${startMonth}_${endMonth}.json`;
        Utils.downloadFile(filename, json, 'application/json');
        return report;
    },

    /**
     * Import JSON data
     */
    async importJSON(jsonString) {
        let data;
        try {
            data = JSON.parse(jsonString);
        } catch (e) {
            throw new Error('Неверный формат JSON');
        }

        const stats = {
            services: 0,
            meters: 0,
            readings: 0,
            tariffs: 0,
            accruals: 0,
            months: 0
        };

        if (data.services) {
            stats.services = await ServicesService.import(data.services);
        }
        if (data.meters) {
            stats.meters = await MetersService.import(data.meters);
        }
        if (data.meterReadings) {
            stats.readings = await ReadingsService.import(data.meterReadings);
        }
        if (data.tariffs) {
            stats.tariffs = await TariffsService.import(data.tariffs);
        }
        if (data.accruals) {
            stats.accruals = await AccrualsService.import(data.accruals);
        }

        return stats;
    },

    /**
     * Parse CSV data
     */
    async parseCSV(csvString) {
        const lines = csvString.split('\n');
        const sections = {};
        let currentSection = null;
        let headers = null;

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('===')) {
                currentSection = trimmed.replace(/===/g, '').trim().toLowerCase().replace(/\s+/g, '_');
                sections[currentSection] = { headers: [], data: [] };
                headers = null;
            } else if (currentSection && trimmed) {
                const values = Utils.parseCSVLine(trimmed);
                
                if (!headers) {
                    headers = values;
                    sections[currentSection].headers = headers;
                } else {
                    const row = {};
                    headers.forEach((h, i) => {
                        row[h] = values[i];
                    });
                    sections[currentSection].data.push(row);
                }
            }
        }

        return sections;
    },

    /**
     * Import CSV data
     */
    async importCSV(csvString) {
        const sections = await this.parseCSV(csvString);
        const stats = {
            services: 0,
            meters: 0,
            readings: 0,
            tariffs: 0,
            accruals: 0
        };

        // Convert section data to appropriate format
        if (sections.services) {
            const services = sections.services.data.map(row => ({
                id: row.id,
                name: row.name?.replace(/"/g, ''),
                shortName: row.shortName?.replace(/"/g, ''),
                category: row.category,
                unit: row.unit,
                meterId: row.meterId || null,
                isMetered: row.isMetered === 'true',
                isActive: row.isActive === 'true'
            }));
            stats.services = await ServicesService.import(services);
        }

        if (sections.meters) {
            const meters = sections.meters.data.map(row => ({
                id: row.id,
                name: row.name?.replace(/"/g, ''),
                type: row.type,
                unit: row.unit,
                serialNumber: row.serialNumber?.replace(/"/g, ''),
                installationDate: row.installationDate || null,
                initialValue: parseFloat(row.initialValue) || 0,
                isActive: row.isActive === 'true'
            }));
            stats.meters = await MetersService.import(meters);
        }

        if (sections.meter_readings) {
            const readings = sections.meter_readings.data.map(row => ({
                id: row.id,
                meterId: row.meterId,
                month: row.month,
                value: parseFloat(row.value) || 0,
                comment: row.comment?.replace(/"/g, '')
            }));
            stats.readings = await ReadingsService.import(readings);
        }

        if (sections.tariffs) {
            const tariffs = sections.tariffs.data.map(row => ({
                id: row.id,
                serviceId: row.serviceId,
                value: parseFloat(row.value) || 0,
                unit: row.unit,
                validFrom: row.validFrom,
                validTo: row.validTo || null
            }));
            stats.tariffs = await TariffsService.import(tariffs);
        }

        if (sections.accruals) {
            const accruals = sections.accruals.data.map(row => ({
                id: row.id,
                serviceId: row.serviceId,
                month: row.month,
                volume: parseFloat(row.volume) || 0,
                tariff: parseFloat(row.tariff) || 0,
                amount: parseFloat(row.amount) || 0,
                calculatedAmount: row.calculatedAmount ? parseFloat(row.calculatedAmount) : null,
                source: row.source,
                comment: row.comment?.replace(/"/g, '')
            }));
            stats.accruals = await AccrualsService.import(accruals);
        }

        return stats;
    },

    /**
     * Preview import file
     */
    async previewImport(file) {
        const content = await Utils.readFileAsText(file);
        const isJson = file.name.endsWith('.json');

        if (isJson) {
            try {
                const data = JSON.parse(content);
                return {
                    type: 'json',
                    counts: {
                        services: data.services?.length || 0,
                        meters: data.meters?.length || 0,
                        readings: data.meterReadings?.length || 0,
                        tariffs: data.tariffs?.length || 0,
                        accruals: data.accruals?.length || 0
                    }
                };
            } catch (e) {
                throw new Error('Ошибка чтения JSON файла');
            }
        } else {
            const sections = await this.parseCSV(content);
            return {
                type: 'csv',
                counts: {
                    services: sections.services?.data.length || 0,
                    meters: sections.meters?.data.length || 0,
                    readings: sections.meter_readings?.data.length || 0,
                    tariffs: sections.tariffs?.data.length || 0,
                    accruals: sections.accruals?.data.length || 0
                }
            };
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImportExportService;
}
