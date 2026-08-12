/**
 * UI Module
 * User interface components and interactions
 */

const UI = {
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show modal with content
     */
    showModal(title, content, buttons = []) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById('modal');
        const titleEl = document.getElementById('modalTitle');
        const bodyEl = document.getElementById('modalBody');
        const footerEl = document.getElementById('modalFooter');

        titleEl.textContent = title;
        bodyEl.innerHTML = typeof content === 'string' ? content : '';
        if (typeof content !== 'string') {
            bodyEl.appendChild(content);
        }

        footerEl.innerHTML = '';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.class || ''}`;
            button.textContent = btn.text;
            button.onclick = () => {
                if (btn.onClick) btn.onClick();
                this.hideModal();
            };
            footerEl.appendChild(button);
        });

        overlay.classList.add('active');
    },

    /**
     * Hide modal
     */
    hideModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    },

    /**
     * Confirm action
     */
    async confirm(message, title = 'Подтверждение') {
        return new Promise(resolve => {
            this.showModal(title, `<p>${message}</p>`, [
                { text: 'Отмена', class: '', onClick: () => resolve(false) },
                { text: 'Подтвердить', class: 'btn-danger', onClick: () => resolve(true) }
            ]);
        });
    },

    /**
     * Switch view
     */
    switchView(viewName) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}View`);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            accruals: 'Начисления',
            meters: 'Счетчики',
            tariffs: 'Тарифы',
            analytics: 'Аналитика',
            services: 'Услуги',
            'import-export': 'Импорт/Экспорт',
            settings: 'Настройки'
        };
        document.getElementById('pageTitle').textContent = titles[viewName] || viewName;

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
        document.querySelector('.sidebar-overlay')?.remove();
    },

    /**
     * Format and display table data
     */
    renderTable(tableId, columns, data, options = {}) {
        const table = document.getElementById(tableId);
        if (!table) return;

        let html = '<thead><tr>';
        columns.forEach(col => {
            html += `<th class="${col.class || ''}">${col.header}</th>`;
        });
        html += '</tr></thead><tbody>';

        if (data.length === 0) {
            html += `<tr><td colspan="${columns.length}" class="empty-state">Нет данных</td></tr>`;
        } else {
            data.forEach((row, index) => {
                html += '<tr>';
                columns.forEach(col => {
                    const value = col.render ? col.render(row) : row[col.field];
                    html += `<td class="${col.class || ''}">${value !== undefined ? value : '—'}</td>`;
                });
                html += '</tr>';
            });
        }

        html += '</tbody>';
        table.innerHTML = html;
    },

    /**
     * Create form element
     */
    createForm(fields, values = {}) {
        const form = document.createElement('form');
        form.className = 'modal-form';

        fields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = field.label;
            if (field.required) label.classList.add('required');
            group.appendChild(label);

            let input;
            if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'form-control';
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    option.selected = opt.value === values[field.name];
                    input.appendChild(option);
                });
            } else if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'form-control';
                input.rows = field.rows || 3;
                input.value = values[field.name] || '';
            } else if (field.type === 'checkbox') {
                group.className = 'checkbox-group';
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = values[field.name] || false;
                label.appendChild(input);
                group.innerHTML = '';
                group.appendChild(label);
                group.appendChild(input);
                form.appendChild(group);
                return;
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
                input.className = 'form-control';
                input.value = values[field.name] || '';
            }

            input.name = field.name;
            input.id = field.name;
            if (field.placeholder) input.placeholder = field.placeholder;
            if (field.required) input.required = true;
            if (field.disabled) input.disabled = true;
            if (field.readonly) input.readOnly = true;

            group.appendChild(input);
            form.appendChild(group);
        });

        return form;
    },

    /**
     * Get form values
     */
    getFormValues(form) {
        const values = {};
        const formData = new FormData(form);
        for (const [name, value] of formData.entries()) {
            values[name] = value;
        }
        
        // Handle checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(input => {
            values[input.name] = input.checked;
        });

        return values;
    },

    /**
     * Set theme
     */
    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            // Auto based on system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        }
        
        // Save to settings
        DB.setSetting('theme', theme);
        
        // Update toggle
        const toggle = document.getElementById('themeSwitch');
        if (toggle) toggle.checked = theme === 'dark';
    },

    /**
     * Initialize sidebar toggle
     */
    initSidebarToggle() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const mobileBtn = document.getElementById('mobileMenuBtn');

        const toggleSidebar = () => {
            sidebar.classList.toggle('open');
            
            // Add overlay for mobile
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.onclick = () => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                };
                document.body.appendChild(overlay);
            }
            overlay.classList.toggle('active', sidebar.classList.contains('open'));
        };

        toggle?.addEventListener('click', toggleSidebar);
        mobileBtn?.addEventListener('click', toggleSidebar);
    },

    /**
     * Initialize navigation
     */
    initNavigation(onNavigate) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (onNavigate) onNavigate(view);
            });
        });
    },

    /**
     * Initialize month selector
     */
    initMonthSelector(currentMonth, onMonthChange) {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        const display = document.getElementById('currentMonthDisplay');

        const updateDisplay = () => {
            display.textContent = Utils.formatMonthDisplay(currentMonth);
        };

        prevBtn?.addEventListener('click', () => {
            const newMonth = Utils.addMonths(currentMonth, -1);
            if (onMonthChange) onMonthChange(newMonth);
            updateDisplay();
        });

        nextBtn?.addEventListener('click', () => {
            const newMonth = Utils.addMonths(currentMonth, 1);
            if (onMonthChange) onMonthChange(newMonth);
            updateDisplay();
        });

        updateDisplay();
    },

    /**
     * Loading state
     */
    setLoading(elementId, loading = true) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        if (loading) {
            el.classList.add('loading');
        } else {
            el.classList.remove('loading');
        }
    },

    /**
     * Populate select options
     */
    populateSelect(selectId, options, selectedValue = null) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '';
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (selectedValue && opt.value === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    },

    /**
     * Render alerts list
     */
    renderAlerts(alerts, containerId = 'alertsList') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!alerts || alerts.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <span class="alert-icon">${alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <div class="alert-content">
                    <h4>${Utils.escapeHtml(alert.message)}</h4>
                    ${alert.month ? `<span class="alert-time">${Utils.formatMonthDisplay(alert.month)}</span>` : ''}
                </div>
            </div>
        `).join('');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
