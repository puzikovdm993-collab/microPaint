/**
 * Главное приложение
 */

const App = {
    currentPage: 'dashboard',
    
    // Карта страниц и их UI компонентов
    pages: {
        dashboard: DashboardUI,
        meters: MetersUI,
        services: ServicesUI,
        payments: PaymentsUI,
        history: HistoryUI,
        analytics: AnalyticsUI,
        settings: SettingsUI
    },

    /**
     * Инициализация приложения
     */
    init() {
        // Инициализируем состояние
        AppState.init();
        
        // Настраиваем навигацию
        this.setupNavigation();
        
        // Настраиваем мобильное меню
        this.setupMobileMenu();
        
        // Обновляем информацию о сроке оплаты
        this.updatePaymentDeadline();
        
        // Рендерим текущую страницу
        this.renderPage(this.currentPage);
        
        console.log('Приложение запущено');
    },

    /**
     * Настройка навигации
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const page = item.dataset.page;
                if (page && this.pages[page]) {
                    this.navigate(page);
                }
            });
        });
    },

    /**
     * Настройка мобильного меню
     */
    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
            
            // Закрываем меню при клике на элемент навигации на мобильных
            const navItems = sidebar.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('open');
                    }
                });
            });
        }
    },

    /**
     * Навигация к странице
     */
    navigate(page) {
        if (this.currentPage === page) return;
        
        this.currentPage = page;
        
        // Обновляем активный пункт меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        // Обновляем заголовок
        const titles = {
            dashboard: 'Дашборд',
            meters: 'Счетчики',
            services: 'Услуги',
            payments: 'Платежи',
            history: 'История',
            analytics: 'Аналитика',
            settings: 'Настройки'
        };
        
        document.getElementById('pageTitle').textContent = titles[page] || 'Дашборд';
        
        // Рендерим страницу
        this.renderPage(page);
        
        // Обновляем срок оплаты
        this.updatePaymentDeadline();
    },

    /**
     * Рендеринг страницы
     */
    renderPage(page) {
        const component = this.pages[page];
        if (component && typeof component.render === 'function') {
            component.render();
        }
    },

    /**
     * Обновление информации о сроке оплаты
     */
    updatePaymentDeadline() {
        const deadlineEl = document.getElementById('paymentDeadline');
        if (!deadlineEl) return;
        
        const settings = AppState.data.settings;
        const deadlineDay = settings.paymentDeadlineDay || 10;
        
        const now = new Date();
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        
        let daysLeft;
        let statusClass;
        let text;
        
        if (currentDay < deadlineDay) {
            daysLeft = deadlineDay - currentDay;
            statusClass = 'normal';
            text = `До оплаты осталось ${daysLeft} дн.`;
        } else if (currentDay === deadlineDay) {
            daysLeft = 0;
            statusClass = 'warning';
            text = 'Сегодня последний день оплаты!';
        } else {
            daysLeft = daysInMonth - currentDay + deadlineDay;
            statusClass = 'urgent';
            text = `Срок оплаты истек (${currentDay - deadlineDay} дн. назад)`;
        }
        
        deadlineEl.className = `payment-deadline ${statusClass}`;
        deadlineEl.textContent = text;
    },

    /**
     * Обновление текущего периода в шапке
     */
    updateCurrentPeriod() {
        const periodEl = document.getElementById('currentPeriod');
        if (!periodEl) return;
        
        const now = new Date();
        const monthName = Utils.getMonthName(now.getMonth());
        periodEl.textContent = `${monthName} ${now.getFullYear()}`;
    }
};

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    App.updateCurrentPeriod();
});
