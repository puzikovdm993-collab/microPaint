/**
 * Компонент уведомлений (Toast)
 */

const Notification = {
    container: null,

    /**
     * Инициализация контейнера уведомлений
     */
    init() {
        this.container = document.getElementById('toastContainer');
    },

    /**
     * Показ уведомления
     */
    show(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 4000
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const titles = {
            success: 'Успешно',
            error: 'Ошибка',
            warning: 'Внимание',
            info: 'Информация'
        };

        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-icon">${icons[type]}</span>
                <span class="toast-title">${title || titles[type]}</span>
            </div>
            <div class="toast-message">${Utils.escapeHtml(message)}</div>
        `;

        this.container.appendChild(toast);

        // Автоматическое удаление через указанное время
        setTimeout(() => {
            this.remove(toast);
        }, duration);
    },

    /**
     * Удаление уведомления
     */
    remove(toast) {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    },

    /**
     * Показ успешного уведомления
     */
    success(message, title) {
        this.show({ type: 'success', message, title });
    },

    /**
     * Показ уведомления об ошибке
     */
    error(message, title) {
        this.show({ type: 'error', message, title });
    },

    /**
     * Показ предупреждения
     */
    warning(message, title) {
        this.show({ type: 'warning', message, title });
    },

    /**
     * Показ информационного уведомления
     */
    info(message, title) {
        this.show({ type: 'info', message, title });
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    Notification.init();
});
