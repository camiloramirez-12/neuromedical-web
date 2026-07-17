/**
 * ARCHIVO: js/notas.js
 * DESCRIPCIÓN: Controlador dinámico de la calculadora analítica de calificaciones.
 * Realiza proyecciones automáticas para determinar metas académicas en tiempo real.
 * AUTOR: Senior Full Stack Developer
 */

document.addEventListener('DOMContentLoaded', () => {
    const sesion = window.db.obtenerSesionActual();
    if (!sesion) return;

    // Quitar preloader
    const loader = document.getElementById('global-preloader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
    }

    const selector = document.getElementById('calc-subject-selector');
    const container = document.getElementById('activities-form-container');
    const materias = window.db.obtenerMateriasPorUsuario(sesion.id);

    // 1. INICIALIZAR DESPLEGABLE DE MATERIAS
    if(materias.length === 0) {
        selector.innerHTML = `<option value="">Sin materias inscritas</option>`;
    } else {
        selector.innerHTML = materias.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    // 2. ESCUCHAR CAMBIOS DE SELECCIÓN
    selector.addEventListener('change', cargarActividadesMateria);
    
    document.getElementById('btn-add-activity').addEventListener('click', () => {
        crearFilaActividad('', '', '');
    });

    function cargarActividadesMateria() {
        container.innerHTML = '';
        const materiaId = selector.value;
        if(!materiaId) return;

        const currentSub = window.db.obtenerTodasLasMaterias().find(m => m.id === materiaId);
        if(currentSub && currentSub.notas && currentSub.notas.length > 0) {
            currentSub.notas.forEach(n => crearFilaActividad(n.nombre, n.porcentaje, n.nota));
        } else {
            // Inicializar filas base por defecto para el estudiante
            crearFilaActividad('Parcial 1', 25, 0);
            crearFilaActividad('Parcial 2', 25, 0);
            crearFilaActividad('Seguimiento', 20, 0);
            crearFilaActividad('Examen Final', 30, 0);
        }
        calcularMetricas();
    }

    function crearFilaActividad(nombre = '', porcentaje = '', nota = '') {
        const row = document.createElement('div');
        row.className = 'activity-row';
        row.innerHTML = `
            <input type="text" class="form-input act-name" value="${nombre}" placeholder="Nombre de la actividad">
            <input type="number" class="form-input act-porc" value="${porcentaje}" min="1" max="100" placeholder="%">
            <input type="number" class="form-input act-nota" value="${nota}" min="0" max="5" step="0.1" placeholder="Nota">
            <button class="btn-primary btn-danger btn-remove-row" style="padding:10px 14px; width:auto;">X</button>
        `;
        
        container.appendChild(row);

        // Añadir escuchas de eventos en vivo para cálculos síncronos automáticos
        row.querySelector('.act-porc').addEventListener('input', calcularMetricas);
        row.querySelector('.act-nota').addEventListener('input', calcularMetricas);
        row.querySelector('.btn-remove-row').addEventListener('click', (e) => {
            e.target.parentElement.remove();
            calcularMetricas();
        });
    }

    function calcularMetricas() {
        const rows = container.querySelectorAll('.activity-row');
        let totalPorcentaje = 0;
        let acumuladoActual = 0;
        let sumaNotasValidas = 0;
        let conteoNotasValidas = 0;

        const listaNotasGuardar = [];

        rows.forEach(r => {
            const name = r.querySelector('.act-name').value || 'Actividad';
            const porc = parseFloat(r.querySelector('.get-porc')?.value || r.querySelector('.act-porc').value) || 0;
            const nota = parseFloat(r.querySelector('.act-nota').value) || 0;

            totalPorcentaje += porc;
            acumuladoActual += (nota * (porc / 100));

            if(nota > 0) {
                sumaNotasValidas += nota;
                conteoNotasValidas++;
            }

            listaNotasGuardar.push({ nombre: name, porcentaje: porc, nota: nota });
        });

        // Advertencia si supera el 100% de la planeación
        if(totalPorcentaje > 100) {
            if (window.app) window.app.mostrarToast('El porcentaje acumulado excede el 100%. Ajuste los pesos.', 'warning');
        }

        // Renderizar salidas operacionales
        const promedio = conteoNotasValidas > 0 ? (sumaNotasValidas / conteoNotasValidas) : 0;
        document.getElementById('res-promedio').innerText = promedio.toFixed(2);
        document.getElementById('res-porcentaje').innerText = `${totalPorcentaje}%`;
        document.getElementById('res-acumulada').innerText = `${acumuladoActual.toFixed(2)} / 5.0`;
        
        const faltante = Math.max(0, 100 - totalPorcentaje);
        document.getElementById('res-restante').innerText = `${faltante}%`;

        // Analizar estados de veredicto técnico
        const badge = document.getElementById('badge-veredicto');
        if (acumuladoActual >= 3.0) {
            badge.innerText = "MATERIA GANADA";
            badge.style.backgroundColor = "rgba(16,185,129,0.2)";
            badge.style.color = "var(--success)";
        } else if (acumuladoActual + (5.0 * (faltante/100)) < 3.0) {
            badge.innerText = "MATERIA PERDIDA INEVITABLE";
            badge.style.backgroundColor = "rgba(239,68,68,0.2)";
            badge.style.color = "var(--danger)";
        } else {
            badge.innerText = "EN CURSO / INDETERMINADO";
            badge.style.backgroundColor = "rgba(245,158,11,0.2)";
            badge.style.color = "var(--warning)";
        }

        // Calcular nota requerida en el porcentaje restante para pasar raspando con 3.0
        const reqElement = document.getElementById('res-requisito');
        if (acumuladoActual >= 3.0) {
            reqElement.innerText = "¡Ya aprobaste la asignatura!";
            reqElement.style.color = "var(--success)";
        } else if (faltante === 0) {
            reqElement.innerText = "Evaluación finalizada.";
            reqElement.style.color = "var(--text-muted)";
        } else {
            const notaNecesaria = (3.0 - acumuladoActual) / (faltante / 100);
            if(notaNecesaria > 5.0) {
                reqElement.innerText = `Imposible aprobar (Requiere ${notaNecesaria.toFixed(2)})`;
                reqElement.style.color = "var(--danger)";
            } else {
                reqElement.innerText = `${Math.max(0, notaNecesaria).toFixed(2)} en el ${faltante}% restante.`;
                reqElement.style.color = "var(--accent-primary)";
            }
        }

        // Auto-guardado en LocalStorage en background para persistir estados
        const materiaId = selector.value;
        if(materiaId && totalPorcentaje <= 100) {
            window.db.actualizarMateria(materiaId, { notas: listaNotasGuardar });
        }
    }

    // Carga inicial
    cargarActividadesMateria();
});