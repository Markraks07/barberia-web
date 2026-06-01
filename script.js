// ==========================================
// 1. BASE DE DATOS LOCAL INICIAL (LOCALSTORAGE)
// ==========================================
function inicializarEstructuraBase() {
    if (!localStorage.getItem('usuarios_app')) {
        localStorage.setItem('usuarios_app', JSON.stringify([
            { id: 1, usuario: 'jefe', clave: '123', nombre: 'Don Cruz (Propietario)', rol: 'jefe' },
            { id: 2, usuario: 'juan', clave: '123', nombre: 'Juan Barber', rol: 'barbero' },
            { id: 3, usuario: 'carlos', clave: '123', nombre: 'Carlos Fade', rol: 'barbero' }
        ]));
    }

    if (!localStorage.getItem('config_horario')) {
        localStorage.setItem('config_horario', JSON.stringify({
            diasAbiertos: [1, 2, 3, 4, 5, 6],
            horasDisponibles: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"]
        }));
    }

    if (!localStorage.getItem('servicios_barber')) {
        localStorage.setItem('servicios_barber', JSON.stringify([
            { id: 101, nombre: 'Corte Degradado + Peinado', precio: 18 },
            { id: 102, nombre: 'Arreglo de Barba Ritual', precio: 12 },
            { id: 103, nombre: 'Servicio Completo Cruz (Corte + Barba)', precio: 28 }
        ]));
    }

    if (!localStorage.getItem('reservas_agenda')) localStorage.setItem('reservas_agenda', JSON.stringify([]));
    
    // NUEVO: Base de datos de clientes CRM (Fidelización y Faltas)
    if (!localStorage.getItem('clientes_crm')) localStorage.setItem('clientes_crm', JSON.stringify([]));
    
    if (!localStorage.getItem('historial_logs')) {
        localStorage.setItem('historial_logs', JSON.stringify([{ tiempo: new Date().toLocaleTimeString(), usuario: 'Sistema', accion: 'Base de datos iniciada.' }]));
    }
}

const DB = {
    get: (clave) => JSON.parse(localStorage.getItem(clave)),
    set: (clave, objeto) => localStorage.setItem(clave, JSON.stringify(objeto))
};

let usuarioActivo = null;

function registrarLog(usuario, accion) {
    const logs = DB.get('historial_logs');
    const ahora = new Date();
    logs.unshift({ tiempo: ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString(), usuario: usuario, accion: accion });
    DB.set('historial_logs', logs);
}

// ==========================================
// 2. DASHBOARD Y CRM (LÓGICA VIP)
// ==========================================
function calcularDashboardFinanciero() {
    const citas = DB.get('reservas_agenda');
    const servicios = DB.get('servicios_barber');
    const usuarios = DB.get('usuarios_app');

    let ingresosTotales = 0;
    let contadorServicios = {};
    let contadorBarberos = {};
    let citasValidas = 0;

    usuarios.forEach(u => { if(u.rol === 'barbero' || u.usuario === 'jefe') contadorBarberos[u.nombre] = 0; });

    citas.forEach(cita => {
        // Excluir inasistencias del cálculo financiero
        if (cita.estado === 'ausente') return;
        
        citasValidas++;
        const srv = servicios.find(s => s.nombre === cita.servicio);
        const precio = srv ? parseFloat(srv.precio) : 0;
        ingresosTotales += precio;

        contadorServicios[cita.servicio] = (contadorServicios[cita.servicio] || 0) + 1;
        if (contadorBarberos[cita.barbero] !== undefined) contadorBarberos[cita.barbero] += precio;
    });

    let servicioEstrella = "-";
    let maxSrv = 0;
    for (const key in contadorServicios) {
        if (contadorServicios[key] > maxSrv) { maxSrv = contadorServicios[key]; servicioEstrella = key; }
    }

    document.getElementById('stat-ingresos').textContent = ingresosTotales + '€';
    document.getElementById('stat-citas').textContent = citasValidas;
    document.getElementById('stat-ticket').textContent = citasValidas > 0 ? (ingresosTotales / citasValidas).toFixed(1) + '€' : '0€';
    document.getElementById('stat-estrella').textContent = servicioEstrella;

    const contenedorGrafico = document.getElementById('grafico-barberos');
    contenedorGrafico.innerHTML = '';
    const maxFacturacionBarbero = Math.max(...Object.values(contadorBarberos), 1);

    for (const barbero in contadorBarberos) {
        const dinero = contadorBarberos[barbero];
        const porcentajeWidth = (dinero / maxFacturacionBarbero) * 100;
        contenedorGrafico.innerHTML += `
            <div class="chart-row">
                <div class="chart-label">${barbero}</div>
                <div class="chart-bar-wrapper">
                    <div class="chart-bar-fill" style="width: ${porcentajeWidth}%">${dinero}€</div>
                </div>
            </div>`;
    }
}

// ==========================================
// 3. RENDERIZADOS: AGENDA, CRM Y CONFIG
// ==========================================
function renderizarListasAdmin() {
    // AGENDA CON MENÚ DE 3 PUNTOS
    const citas = DB.get('reservas_agenda');
    
    // Ordenar citas por fecha y hora (más recientes primero)
    citas.sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`));

    document.getElementById('tabla-reservas').innerHTML = citas.map(c => `
        <tr>
            <td>${c.fecha}</td>
            <td><strong>${c.hora}</strong></td>
            <td>${c.nombre}</td>
            <td><a href="tel:${c.telefono}" style="color:var(--primary);">${c.telefono}</a></td>
            <td>${c.barbero}</td>
            <td>${c.servicio}</td>
            <td><span class="status status-${c.estado || 'pendiente'}">${c.estado || 'Pendiente'}</span></td>
            <td>
                <div class="acciones-menu">
                    <button class="btn-dots">⋮</button>
                    <div class="dropdown-content">
                        <button onclick="enviarWhatsApp('${c.telefono}', '${c.nombre}', '${c.fecha}', '${c.hora}', '${c.barbero}')">📲 Enviar WhatsApp</button>
                        <button onclick="cambiarEstadoCita(${c.id}, 'completado')">✅ Marcar Completado</button>
                        <button onclick="cambiarEstadoCita(${c.id}, 'ausente')">👻 No se presentó</button>
                        <button onclick="borrarCitaEnAgenda(${c.id})">❌ Eliminar Turno</button>
                    </div>
                </div>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;">No hay turnos en la agenda.</td></tr>';

    // INFO DEL HORARIO ACTUAL (Debajo de la agenda)
    const config = DB.get('config_horario');
    const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const diasActivos = config.diasAbiertos.map(d => diasNombres[d]).join(', ');
    document.getElementById('info-horario-agenda').innerHTML = `
        <strong>Configuración Activa de tu Local:</strong><br>
        🗓️ <strong>Días abiertos:</strong> ${diasActivos} <br>
        ⏰ <strong>Franjas disponibles:</strong> ${config.horasDisponibles.length} turnos diarios.
    `;

    // CRM Y FIDELIZACIÓN
    const crm = DB.get('clientes_crm');
    document.getElementById('tabla-crm').innerHTML = crm.sort((a,b) => b.gastado - a.gastado).map(c => {
        let nivelHTML = '<span class="status status-completado">Regular</span>';
        if (c.faltas >= 2) nivelHTML = '<span class="status status-bloqueado">Bloqueado 🚫</span>';
        else if (c.gastado > 100) nivelHTML = '<span class="status status-vip">Cliente VIP 👑</span>';
        
        return `<tr>
            <td><strong>${c.nombre}</strong></td>
            <td>${c.telefono}</td>
            <td>${c.visitas}</td>
            <td>${c.gastado}€</td>
            <td style="color:${c.faltas > 0 ? '#ff4757' : 'inherit'}">${c.faltas}</td>
            <td>${nivelHTML}</td>
        </tr>`;
    }).join('') || '<tr><td colspan="6">Aún no hay historial de clientes.</td></tr>';

    // SERVICIOS Y EMPLEADOS
    const servicios = DB.get('servicios_barber');
    document.getElementById('tabla-servicios').innerHTML = servicios.map(s => `<tr><td><strong>${s.nombre}</strong></td><td>${s.precio}€</td><td><button class="btn-eliminar" onclick="borrarServicio(${s.id})">Eliminar</button></td></tr>`).join('');

    const usuarios = DB.get('usuarios_app');
    document.getElementById('tabla-empleados').innerHTML = usuarios.map(u => `<tr><td>${u.nombre}</td><td><code>${u.usuario}</code></td><td>${u.rol.toUpperCase()}</td><td>${u.usuario !== 'jefe' ? `<button class="btn-eliminar" onclick="borrarEmpleado(${u.id})">Eliminar</button>` : '-'}</td></tr>`).join('');

    const logs = DB.get('historial_logs');
    document.getElementById('log-actividad').innerHTML = logs.map(l => `<div class="log-item"><span class="time">[${l.tiempo}]</span><span class="user">${l.usuario}:</span>${l.accion}</div>`).join('');
}

// ==========================================
// 4. ACCIONES AVANZADAS: 3 PUNTOS Y WHATSAPP
// ==========================================
function enviarWhatsApp(telefono, nombre, fecha, hora, barbero) {
    // Si el teléfono tiene el prefijo de España, bien, si no, lo asumimos (Demo).
    let tel = telefono.replace(/\D/g,'');
    if(tel.length === 9) tel = '34' + tel; 
    
    const mensaje = `Hola ${nombre}, te escribimos de Barbería Cruz 💈. Queríamos recordarte tu cita para el día ${fecha} a las ${hora} con ${barbero}. ¿Nos confirmas tu asistencia? ¡Gracias!`;
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    registrarLog(usuarioActivo.nombre, `Envió recordatorio de WhatsApp a ${nombre}`);
}

function cambiarEstadoCita(id, nuevoEstado) {
    let agenda = DB.get('reservas_agenda');
    let cita = agenda.find(c => c.id === id);
    if(!cita || cita.estado === nuevoEstado) return;

    cita.estado = nuevoEstado;
    DB.set('reservas_agenda', agenda);

    // Actualizar el CRM del cliente
    let crm = DB.get('clientes_crm');
    let cliente = crm.find(c => c.telefono === cita.telefono);
    
    // Si no existe, lo creamos en el radar
    if(!cliente) {
        cliente = { nombre: cita.nombre, telefono: cita.telefono, visitas: 0, gastado: 0, faltas: 0 };
        crm.push(cliente);
    }

    if(nuevoEstado === 'completado') {
        const srv = DB.get('servicios_barber').find(s => s.nombre === cita.servicio);
        cliente.visitas += 1;
        cliente.gastado += (srv ? parseFloat(srv.precio) : 0);
        registrarLog(usuarioActivo.nombre, `Marcó como completado el servicio de ${cita.nombre} (+${srv ? srv.precio : 0}€ a caja).`);
    } else if (nuevoEstado === 'ausente') {
        cliente.faltas += 1;
        registrarLog(usuarioActivo.nombre, `Registró inasistencia (Fantasma) al cliente ${cita.nombre}.`);
        if(cliente.faltas >= 2) alert(`⚠️ ¡ATENCIÓN! El cliente ${cliente.nombre} ha alcanzado 2 faltas y ha sido bloqueado del sistema online.`);
    }

    DB.set('clientes_crm', crm);
    renderizarListasAdmin();
    calcularDashboardFinanciero();
}

function borrarCitaEnAgenda(id) {
    let citas = DB.get('reservas_agenda');
    const encontrada = citas.find(c => c.id === id);
    if(encontrada && confirm('¿Deseas revocar esta reserva permanentemente?')) {
        citas = citas.filter(c => c.id !== id);
        DB.set('reservas_agenda', citas);
        registrarLog(usuarioActivo.nombre, `Eliminó la cita de ${encontrada.nombre}`);
        renderizarListasAdmin();
        calcularDashboardFinanciero();
    }
}

// RESTO DE FUNCIONES CRUD BÁSICAS...
function borrarServicio(id) { let srvs = DB.get('servicios_barber'); if(confirm('¿Eliminar servicio?')) { DB.set('servicios_barber', srvs.filter(s => s.id !== id)); cargarParametrosEnWeb(); renderizarListasAdmin(); } }
function borrarEmpleado(id) { let usrs = DB.get('usuarios_app'); if(confirm('¿Eliminar empleado?')) { DB.set('usuarios_app', usrs.filter(u => u.id !== id)); renderizarListasAdmin(); cargarParametrosEnWeb(); } }

document.getElementById('btn-guardar-horario').addEventListener('click', function() {
    const diasSeleccionados = Array.from(document.querySelectorAll('.check-dia:checked')).map(chk => parseInt(chk.value));
    const horasSeleccionadas = Array.from(document.querySelectorAll('.check-hora-conf:checked')).map(chk => chk.value);
    DB.set('config_horario', { diasAbiertos: diasSeleccionados, horasDisponibles: horasSeleccionadas });
    registrarLog(usuarioActivo.nombre, `Modificó horarios de apertura.`);
    alert('✅ Estructura horaria guardada.');
    renderizarListasAdmin();
});

// ==========================================
// 5. VALIDACIONES WEB PÚBLICA (LISTA NEGRA)
// ==========================================
function cargarParametrosEnWeb() {
    const servicios = DB.get('servicios_barber');
    document.getElementById('contenedor-servicios-web').innerHTML = servicios.map(s => `<div class="servicio-card"><h3>${s.nombre}</h3><h4 style="color:var(--primary); font-size:1.4rem; margin-top:8px;">${s.precio}€</h4></div>`).join('');
    document.getElementById('servicio-reserva').innerHTML = '<option value="">-- Elige Servicio --</option>' + servicios.map(s => `<option value="${s.nombre}">${s.nombre} (${s.precio}€)</option>`).join('');
    document.getElementById('barbero-reserva').innerHTML = '<option value="">-- Elige Barbero --</option>' + DB.get('usuarios_app').map(u => `<option value="${u.nombre}">${u.nombre}</option>`).join('');
}

document.getElementById('fecha-reserva').addEventListener('change', function() {
    const diaSemana = new Date(this.value).getDay();
    const config = DB.get('config_horario');
    const selectHora = document.getElementById('hora-reserva');
    if (!config.diasAbiertos.includes(diaSemana)) {
        document.getElementById('error-dia-cerrado').textContent = '❌ El local permanece CERRADO este día.';
        selectHora.innerHTML = '<option value="">Cerrado</option>';
        document.getElementById('btn-confirmar-reserva-final').disabled = true;
    } else {
        document.getElementById('error-dia-cerrado').textContent = '';
        document.getElementById('btn-confirmar-reserva-final').disabled = false;
        selectHora.innerHTML = '<option value="">-- Seleccionar Hora --</option>' + config.horasDisponibles.map(h => `<option value="${h}">${h}</option>`).join('');
    }
});

document.getElementById('formulario-reserva').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre-reserva').value;
    const telefono = document.getElementById('telefono-reserva').value;
    const fecha = document.getElementById('fecha-reserva').value;
    const hora = document.getElementById('hora-reserva').value;
    const servicio = document.getElementById('servicio-reserva').value;
    const barbero = document.getElementById('barbero-reserva').value;

    const msgDiv = document.getElementById('mensaje-respuesta-reserva');
    
    // SISTEMA FANTASMA: Comprobar si el cliente está en la Lista Negra (>= 2 faltas)
    const crm = DB.get('clientes_crm');
    const clienteVIP = crm.find(c => c.telefono === telefono);
    
    if(clienteVIP && clienteVIP.faltas >= 2) {
        msgDiv.innerHTML = '🚫 <b>Reserva bloqueada.</b> Has acumulado demasiadas ausencias sin avisar. Por favor, llama al local para reservar.';
        msgDiv.className = 'error-msg';
        return;
    }

    const agenda = DB.get('reservas_agenda');
    if(agenda.some(c => c.fecha === fecha && c.hora === hora && c.barbero === barbero && c.estado !== 'ausente' && c.estado !== 'cancelado')) {
        msgDiv.textContent = '⚠️ Este barbero ya tiene esa hora reservada.';
        msgDiv.className = 'error-msg';
        return;
    }

    // Se guarda con estado 'pendiente' por defecto
    agenda.push({ id: Date.now(), nombre, telefono, fecha, hora, servicio, barbero, estado: 'pendiente' });
    DB.set('reservas_agenda', agenda);
    
    registrarLog('Web Pública', `Nuevo turno online de ${nombre} con ${barbero} (${fecha} a las ${hora})`);
    
    msgDiv.textContent = '✅ ¡Tu plaza ha sido guardada de forma segura!';
    msgDiv.style.color = '#2ed573';
    this.reset();
    setTimeout(() => { msgDiv.textContent = ''; document.getElementById('modal-reserva').style.display = 'none'; }, 2500);
});

// ==========================================
// 6. INICIALIZACIÓN GENERAL (EVENTOS DOM)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarEstructuraBase();
    cargarParametrosEnWeb();

    const configActual = DB.get('config_horario');
    document.getElementById('wrapper-horas-check').innerHTML = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"].map(h => `<label><input type="checkbox" class="check-hora-conf" value="${h}" ${configActual.horasDisponibles.includes(h) ? 'checked' : ''}> ${h}</label>`).join('');
    document.querySelectorAll('.check-dia').forEach(chk => { if(configActual.diasAbiertos.includes(parseInt(chk.value))) chk.checked = true; });

    document.getElementById('menu-hamburguesa').addEventListener('click', function() { this.classList.toggle('activo'); document.getElementById('nav-menu').classList.toggle('activo'); });

    const modalLogin = document.getElementById('modal-login');
    const modalReserva = document.getElementById('modal-reserva');
    document.getElementById('btn-abrir-login').addEventListener('click', (e) => { e.preventDefault(); modalLogin.style.display = 'block'; });
    document.getElementById('btn-abrir-reserva').addEventListener('click', () => { modalReserva.style.display = 'block'; });
    document.querySelector('.close-login').addEventListener('click', () => modalLogin.style.display = 'none');
    document.querySelector('.close-reserva').addEventListener('click', () => modalReserva.style.display = 'none');

    document.getElementById('formulario-login').addEventListener('submit', function(e) {
        e.preventDefault();
        const validado = DB.get('usuarios_app').find(u => u.usuario === document.getElementById('login-usuario').value.toLowerCase().trim() && u.clave === document.getElementById('login-password').value);

        if (validado) {
            usuarioActivo = validado;
            document.getElementById('saludo-usuario').textContent = `Conectado como: ${validado.nombre}`;
            if (validado.rol === 'barbero') {
                document.querySelectorAll('.solo-jefe').forEach(el => el.style.display = 'none');
                document.getElementById('tab-dashboard').classList.remove('activo');
                document.getElementById('tab-reservas').classList.add('activo');
                document.querySelector('[data-target="tab-reservas"]').classList.add('activo');
            } else {
                document.querySelectorAll('.solo-jefe').forEach(el => el.style.display = 'block');
            }
            modalLogin.style.display = 'none';
            document.getElementById('vista-web').style.display = 'none';
            document.getElementById('panel-admin').style.display = 'block';
            renderizarListasAdmin();
            calcularDashboardFinanciero();
            this.reset();
        } else {
            document.getElementById('login-error').textContent = '❌ Credenciales incorrectas.';
        }
    });

    document.getElementById('btn-cerrar-admin').addEventListener('click', () => {
        usuarioActivo = null;
        document.getElementById('panel-admin').style.display = 'none';
        document.getElementById('vista-web').style.display = 'block';
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(btn.style.display === 'none') return;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('activo'));
            btn.classList.add('activo');
            document.getElementById(btn.dataset.target).classList.add('activo');
        });
    });
});