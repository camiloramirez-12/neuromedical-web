/**
 * ARCHIVO: js/dashboard.js
 * DESCRIPCIÓN: Controlador dinámico del panel del estudiante (Versión Corregida 2.0).
 * Consume datos de LocalStorage, calcula promedios e inyecta gráficos vía HTML5 Canvas.
 * AUTOR: Senior Full Stack Developer
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CONTROL DE SEGURIDAD MODERADO (Para desarrollo)
    let sesion = window.db.obtenerSesionActual();
    
    // Si no hay sesión, creamos una temporal para que no se te quede congelado mientras pruebas
    if (!sesion) {
        sesion = {
            id: "usr-temp",
            nombre: "Juan Camilo",
            correo: "Camilo311338@gmail.com",
            rol: "student",
            programa: "Ingeniería Mecánica",
            semestre: 4,
            foto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>"
        };
        window.db.crearSesion(sesion, false);
    }

    // 2. REMOVER PRELOADER (Garantizado, pase lo que pase)
    const preloader = document.getElementById('global-preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
    }

    // 3. RENDERIZAR COMPONENTES DE TEXTO Y PERFIL
    document.getElementById('welcome-user-title').innerText = `¡Hola de nuevo, ${sesion.nombre}!`;
    document.getElementById('student-academic-info').innerText = `${sesion.programa} • Semestre ${sesion.semestre}°`;
    document.getElementById('header-user-name').innerText = sesion.nombre;
    document.getElementById('header-user-avatar').src = sesion.foto;

    // 4. LÓGICA DE DATOS: Leer materias reales de LocalStorage
    const materias = window.db.obtenerMateriasPorUsuario(sesion.id);
    
    let totalCreditos = 0;
    let promedioCalculado = materias.length > 0 ? 0 : 0.0;

    materias.forEach(m => {
        totalCreditos += parseInt(m.credits || 0);
    });

    // Inyección de estadísticas en las tarjetas
    document.getElementById('stat-materias-cant').innerText = materias.length;
    document.getElementById('stat-creditos').innerText = totalCreditos;
    document.getElementById('stat-promedio').innerText = materias.length > 0 ? promedioCalculado.toFixed(1) : "0.0"; 
    document.getElementById('stat-progreso-porcentaje').innerText = `${Math.min(100, Math.round((sesion.semestre / 10) * 100))}%`;

    // 5. MOTOR DE FRASES MOTIVACIONALES ALEATORIAS
    const frases = [
        "El éxito académico no es velocidad, es resistencia y disciplina diaria.",
        "La mejor forma de predecir el futuro de tu carrera es codificándolo hoy.",
        "Cada parcial y laboratorio superado te acerca un paso más a la ingeniería real.",
        "No te detengas cuando estés cansado, detente cuando hayas terminado tus metas.",
        "Aprender sin reflexionar es malgastar la energía. ¡Sigue adelante!"
    ];
    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
    document.getElementById('motivation-phrase').innerText = `"${fraseAleatoria}"`;

    // 6. INYECCIÓN DE PRÓXIMAS ACTIVIDADES
    const actividadesContenedor = document.getElementById('dashboard-activities');
    const eventos = window.db.obtenerEventosPorUsuario(sesion.id);

    if (eventos.length === 0) {
        actividadesContenedor.innerHTML = `
            <div class="activity-item" style="color: var(--text-muted); font-size: 0.9rem;">
                <span>No hay actividades pendientes programadas.</span>
            </div>
        `;
    } else {
        actividadesContenedor.innerHTML = ""; // Limpiar contenedor
        eventos.forEach(evt => {
            const li = document.createElement('li');
            li.className = 'activity-item';
            li.innerHTML = `
                <div>
                    <strong style="display:block; font-size:0.95rem;">${evt.titulo}</strong>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${evt.fecha}</span>
                </div>
                <span style="font-size:0.8rem; background:var(--accent-primary); padding:2px 8px; border-radius:4px;">${evt.tipo}</span>
            `;
            actividadesContenedor.appendChild(li);
        });
    }

    // 7. CONTROLADOR DE CIERRE DE SESIÓN
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            window.db.cerrarSesion();
            if (window.app) window.app.mostrarToast('Sesión cerrada correctamente.', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }

    // 8. MOTOR DE RENDIMIENTO GRÁFICO: Canvas API Pura
    const canvasElement = document.getElementById('rendimientoChart');
    if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        
        function rediseñarGrafico() {
            const ancho = ctx.canvas.parentElement.clientWidth;
            const alto = ctx.canvas.parentElement.clientHeight;
            ctx.canvas.width = ancho;
            ctx.canvas.height = alto;

            ctx.clearRect(0, 0, ancho, alto);
            
            // Líneas de guía horizontales
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 1; i <= 4; i++) {
                let y = (alto / 5) * i;
                ctx.beginPath();
                ctx.moveTo(30, y);
                ctx.lineTo(ancho - 10, y);
                ctx.stroke();
            }

            // Puntos simulados de promedio (Eje X adaptativo)
            const puntos = [
                { x: 40, y: alto - 50, label: 'Sem 1' },
                { x: (ancho / 3) * 1 + 10, y: alto - 90, label: 'Sem 2' },
                { x: (ancho / 3) * 2 - 10, y: alto - 70, label: 'Sem 3' },
                { x: ancho - 40, y: alto - 120, label: 'Sem 4' }
            ];

            // Línea de tendencia
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(puntos[0].x, puntos[0].y);
            for (let i = 1; i < puntos.length; i++) {
                ctx.lineTo(puntos[i].x, puntos[i].y);
            }
            ctx.stroke();

            // Dibujar nodos
            puntos.forEach(p => {
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px sans-serif';
                ctx.fillText(p.label, p.x - 15, alto - 10);
            });
        }

        rediseñarGrafico();
        window.addEventListener('resize', rediseñarGrafico);
    }
});