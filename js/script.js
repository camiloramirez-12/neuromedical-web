/**
 * ARCHIVO: js/script.js
 * DESCRIPCIÓN: Controlador core del frontend. Gestiona componentes comunes,
 * temas, notificaciones elegantes y atajos de teclado.
 * AUTOR: Senior Full Stack Developer
 */

class AppCore {
    constructor() {
        this.toastContainer = document.getElementById('global-toast-container');
        this.registrarAtajosTeclado();
    }

    /**
     * Lanza una notificación elegante estilo Toast en pantalla.
     * @param {string} mensaje - Texto a mostrar.
     * @param {'info'|'success'|'danger'|'warning'} tipo - Estado de la alerta.
     */
    mostrarToast(mensaje, tipo = 'info') {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'global-toast-container';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        
        // Asignación de color de borde según tipo de alerta
        let color = 'var(--accent-primary)';
        if (tipo === 'success') color = 'var(--success)';
        if (tipo === 'danger') color = 'var(--danger)';
        if (tipo === 'warning') color = 'var(--warning)';
        toast.style.borderLeftColor = color;

        toast.innerHTML = `
            <div class="toast-content" style="font-size: 0.95rem; font-weight: 500;">
                ${mensaje}
            </div>
        `;

        this.toastContainer.appendChild(toast);

        // Remover de manera limpia a los 4 segundos con animación suave
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.transition = 'all 0.4s ease';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    /**
     * Registra atajos de teclado de nivel de sistema para mejorar la productividad.
     */
    registrarAtajosTeclado() {
        document.addEventListener('keydown', (e) => {
            // ALT + T: Cambiar de Tema de color al instante sin recargar la página
            if (e.altKey && (e.key === 't' || e.key === 'T')) {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', nextTheme);
                if (window.db) window.db.guardarConfiguracion({ theme: nextTheme });
                this.mostrarToast(`Tema cambiado a modo ${nextTheme === 'dark' ? 'oscuro' : 'claro'}`, 'info');
            }
        });
    }
}

window.app = new AppCore();