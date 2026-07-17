/**
 * ARCHIVO: js/login.js
 * DESCRIPCIÓN: Controlador de Autenticación en Texto Plano (Sin SHA).
 * Valida formularios e intercepta credenciales directamente.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar preloader de páginas de autenticación
    const preloader = document.getElementById('global-preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
        }, 300);
    }

    // --- MANEJO DEL FORMULARIO DE INICIO DE SESIÓN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;
            const remember = document.getElementById('login-remember').checked;
            
            if (!email || !pass) {
                if (window.app) window.app.mostrarToast('Por favor, rellene todos los campos.', 'warning');
                return;
            }

            let respuesta;
            
            // CASO ESPECIAL: Validación directa del Administrador Maestro
            if (email === "admin@pascual.edu.co" && pass === "juan311338") {
                respuesta = { error: false, usuario: { id: "admin-001", nombre: "Administrador Core", correo: "admin@universidad.edu.co", rol: "admin" } };
            } else {
                // Validación normal en texto plano para estudiantes y profesores
                respuesta = window.db.validarLogin(email, pass);
            }
            
            if (respuesta.error) {
                if (window.app) window.app.mostrarToast(respuesta.mensaje, 'danger');
            } else {
                if (window.app) window.app.mostrarToast('Autenticación correcta. Redirigiendo...', 'success');
                
                // Guardar la sesión actual
                window.db.crearSesion(respuesta.usuario, remember);
                
                // Enrutamiento inteligente según privilegios de rol
                setTimeout(() => {
                    if (respuesta.usuario.rol === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1000);
            }
        });
    }

    // --- MANEJO DEL FORMULARIO DE REGISTRO DE ESTUDIANTES ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const programa = document.getElementById('reg-programa').value;
            const semestre = document.getElementById('reg-semestre').value;
            const pass = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;
            
            // Validaciones del lado del cliente
            if (!name || !email || !programa || !semestre || !pass || !confirm) {
                if (window.app) window.app.mostrarToast('Todos los campos son obligatorios.', 'warning');
                return;
            }
            
            if (pass !== confirm) {
                if (window.app) window.app.mostrarToast('Las contraseñas ingresadas no coinciden.', 'danger');
                return;
            }

            if (pass.length < 6) {
                if (window.app) window.app.mostrarToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
                return;
            }

            // Objeto del estudiante guardando la clave tal cual la escribe
            const nuevoEstudiante = {
                nombre: name,
                correo: email,
                contrasena: pass, // Texto plano directo
                rol: 'student',
                programa: programa,
                semestre: parseInt(semestre),
                foto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>"
            };

            // Guardar usuario en la base de datos
            const resultado = window.db.guardarUsuario(nuevoEstudiante);
            
            if (resultado.error) {
                if (window.app) window.app.mostrarToast(resultado.mensaje, 'danger');
            } else {
                if (window.app) window.app.mostrarToast('Cuenta académica creada con éxito. Inicia sesión.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        });
    }
});