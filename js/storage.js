/**
 * ARCHIVO: js/storage.js
 * DESCRIPCIÓN: Capa de Abstracción de Datos (DAL) en la nube.
 * Sincroniza el LocalStorage local con una base de datos en tiempo real (Firebase)
 * para permitir la persistencia espejo entre PC y Celular.
 * AUTOR: Senior Full Stack Developer
 */

class UniversidadCloudStorage {
    constructor() {
        this.INIT_KEY_USERS = 'uni_users';
        this.INIT_KEY_SUBJECTS = 'uni_subjects';
        this.INIT_KEY_EVENTS = 'uni_events';
        this.INIT_KEY_SESSION = 'uni_current_session';
        this.INIT_KEY_CONFIG = 'uni_global_config';
        
        // URL de tu base de datos en la nube (Te enseñaré a crearla gratis en el siguiente paso)
        this.CLOUD_DB_URL = "https://sistema-unversidad-default-rtdb.firebaseio.com"; 

        this._inicializarBaseDatosLocal();
    }

    _inicializarBaseDatosLocal() {
        if (!localStorage.getItem(this.INIT_KEY_USERS)) {
            const defaultAdmin = [{
                id: "admin-001",
                nombre: "Administrador Central",
                correo: "admin@universidad.edu.co",
                contrasena: "Admin2026*",
                rol: "admin",
                programa: "Dirección Académica",
                semestre: "N/A",
                foto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234f46e5'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z'/></svg>"
            }];
            localStorage.setItem(this.INIT_KEY_USERS, JSON.stringify(defaultAdmin));
        }
        // Intentar descargar datos espejo de la nube apenas abre la app
        this.descargarDatosDeLaNube();
    }

    /**
     * Sincroniza los datos locales enviándolos a la nube (POST/PUT de respaldo)
     * @private
     */
    async _guardarEnLaNube(endpoint, data) {
        try {
            await fetch(`${this.CLOUD_DB_URL}/${endpoint}.json`, {
                method: 'PUT',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.warn("Modo offline detectado. Los datos se guardarán localmente hasta recuperar conexión.");
        }
    }

    /**
     * Saca una copia de la base de datos en la nube y la monta en el dispositivo actual
     */
    async descargarDatosDeLaNube() {
        try {
            const res = await fetch(`${this.CLOUD_DB_URL}/.json`);
            const datosNube = await res.json();
            if (datosNube) {
                if (datosNube.usuarios) localStorage.setItem(this.INIT_KEY_USERS, JSON.stringify(Object.values(datosNube.usuarios)));
                if (datosNube.materias) localStorage.setItem(this.INIT_KEY_SUBJECTS, JSON.stringify(Object.values(datosNube.materias)));
                if (datosNube.eventos) localStorage.setItem(this.INIT_KEY_EVENTS, JSON.stringify(Object.values(datosNube.eventos)));
            }
        } catch (e) {
            console.log("No se pudo sincronizar con la nube. Operando con caché local.");
        }
    }

    // --- ENLACES INTERNOS CON EXPORTACIÓN AUTOMÁTICA ---

    obtenerUsuarios() {
        return JSON.parse(localStorage.getItem(this.INIT_KEY_USERS)) || [];
    }

    guardarUsuario(usuario) {
        const usuarios = this.obtenerUsuarios();
        if (usuarios.find(u => u.correo === usuario.correo)) {
            return { error: true, mensaje: 'El correo electrónico ya está registrado.' };
        }
        usuario.id = 'usr-' + Math.random().toString(36).substr(2, 9);
        usuarios.push(usuario);
        
        localStorage.setItem(this.INIT_KEY_USERS, JSON.stringify(usuarios));
        this._guardarEnLaNube('usuarios', usuarios); // Sincroniza al tiro
        return { error: false, usuario };
    }

    actualizarUsuario(id, datosActualizados) {
        const usuarios = this.obtenerUsuarios();
        const index = usuarios.findIndex(u => u.id === id);
        if (index === -1) return { error: true, mensaje: 'Usuario no encontrado.' };
        
        usuarios[index] = { ...usuarios[index], ...datosActualizados };
        localStorage.setItem(this.INIT_KEY_USERS, JSON.stringify(usuarios));
        this._guardarEnLaNube('usuarios', usuarios);

        const sesionActual = this.obtenerSesionActual();
        if (sesionActual && sesionActual.id === id) {
            this.crearSesion(usuarios[index], true);
        }
        return { error: false, usuario: usuarios[index] };
    }

    validarLogin(correo, contrasena) {
        this.descargarDatosDeLaNube(); // Asegurar datos frescos en el celular al loguearse
        const usuarios = this.obtenerUsuarios();
        const usuario = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);
        if (!usuario) return { error: true, mensaje: 'Credenciales inválidas.' };
        return { error: false, usuario };
    }

    crearSesion(usuario, recordar = false) {
        const sesionData = JSON.stringify(usuario);
        sessionStorage.setItem(this.INIT_KEY_SESSION, sesionData);
        if (recordar) localStorage.setItem(this.INIT_KEY_SESSION, sesionData);
    }

    obtenerSesionActual() {
        const sesionStr = sessionStorage.getItem(this.INIT_KEY_SESSION) || localStorage.getItem(this.INIT_KEY_SESSION);
        return sesionStr ? JSON.parse(sesionStr) : null;
    }

    cerrarSesion() {
        sessionStorage.removeItem(this.INIT_KEY_SESSION);
        localStorage.removeItem(this.INIT_KEY_SESSION);
    }

    obtenerTodasLasMaterias() {
        return JSON.parse(localStorage.getItem(this.INIT_KEY_SUBJECTS)) || [];
    }

    obtenerMateriasPorUsuario(usuarioId) {
        return this.obtenerTodasLasMaterias().filter(m => m.usuarioId === usuarioId);
    }

    guardarMateria(materia) {
        const materias = this.obtenerTodasLasMaterias();
        materia.id = 'mat-' + Math.random().toString(36).substr(2, 9);
        if (!materia.notas) materia.notas = [];
        materias.push(materia);
        
        localStorage.setItem(this.INIT_KEY_SUBJECTS, JSON.stringify(materias));
        this._guardarEnLaNube('materias', materias);
        return materia;
    }

    actualizarMateria(materiaId, datosActualizados) {
        const materias = this.obtenerTodasLasMaterias();
        const index = materias.findIndex(m => m.id === materiaId);
        if (index === -1) return null;

        materias[index] = { ...materias[index], ...datosActualizados };
        localStorage.setItem(this.INIT_KEY_SUBJECTS, JSON.stringify(materias));
        this._guardarEnLaNube('materias', materias);
        return materias[index];
    }

    eliminarMateria(materiaId) {
        let materias = this.obtenerTodasLasMaterias();
        materias = materias.filter(m => m.id !== materiaId);
        
        localStorage.setItem(this.INIT_KEY_SUBJECTS, JSON.stringify(materias));
        this._guardarEnLaNube('materias', materias);
    }

    obtenerEventosPorUsuario(usuarioId) {
        const eventos = JSON.parse(localStorage.getItem(this.INIT_KEY_EVENTS)) || [];
        return eventos.filter(e => e.usuarioId === usuarioId);
    }

    guardarEvento(evento) {
        const eventos = JSON.parse(localStorage.getItem(this.INIT_KEY_EVENTS)) || [];
        evento.id = 'evt-' + Math.random().toString(36).substr(2, 9);
        eventos.push(evento);
        
        localStorage.setItem(this.INIT_KEY_EVENTS, JSON.stringify(eventos));
        this._guardarEnLaNube('eventos', eventos);
        return evento;
    }

    eliminarEvento(eventoId) {
        let eventos = JSON.parse(localStorage.getItem(this.INIT_KEY_EVENTS)) || [];
        eventos = eventos.filter(e => e.id !== eventoId);
        
        localStorage.setItem(this.INIT_KEY_EVENTS, JSON.stringify(eventos));
        this._guardarEnLaNube('eventos', eventos);
    }

    obtenerConfiguracion() {
        return JSON.parse(localStorage.getItem(this.INIT_KEY_CONFIG)) || { theme: 'dark' };
    }

    guardarConfiguracion(nuevaConfig) {
        localStorage.setItem(this.INIT_KEY_CONFIG, JSON.stringify(nuevaConfig));
        return nuevaConfig;
    }
}

window.db = new UniversidadCloudStorage();