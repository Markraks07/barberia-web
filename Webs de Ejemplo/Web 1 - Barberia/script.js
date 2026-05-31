// MENÚ HAMBURGUESA
const hamburguesa = document.getElementById('menu-hamburguesa');
const navMenu = document.getElementById('nav-menu');

hamburguesa.addEventListener('click', function() {
    hamburguesa.classList.toggle('activo');
    navMenu.classList.toggle('activo');
});

// Cerrar menú al hacer click en un link
document.querySelectorAll('#nav-menu a').forEach(link => {
    link.addEventListener('click', function() {
        hamburguesa.classList.remove('activo');
        navMenu.classList.remove('activo');
    });
});

// Obtén el modal
const modal = document.getElementById('modal-reserva');

// Obtén el botón "Reservar cita"
const btnReservar = document.querySelector('a[href="#modal-reserva"]');

// Obtén el botón close (la X)
const closeBtn = document.querySelector('.close');

// Función para abrir
function abrirModal(e) {
    e.preventDefault();
    modal.style.display = 'block';
}

// Función para cerrar
function cerrarModal() {
    modal.style.display = 'none';
}

// Event listeners
btnReservar.addEventListener('click', abrirModal);
closeBtn.addEventListener('click', cerrarModal);

// Cierra si haces click fuera del modal
window.addEventListener('click', function(e) {
    if (e.target == modal) {
        cerrarModal();
    }
});

function mostrarMensaje(texto, tipo) {
    const div = document.getElementById('mensaje-respuesta');
    div.textContent = texto;
    div.className = 'form-message ' + tipo;
    
    setTimeout(function() {
        div.className = 'form-message';
    }, 5000);
}

const formularioReserva = document.getElementById('formulario-reserva');

formularioReserva.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre-reserva').value;
    const telefono = document.getElementById('telefono-reserva').value;
    const fecha = document.getElementById('fecha-reserva').value;
    const barbero = document.getElementById('barbero').value;
    const hora = document.getElementById('hora-reserva').value;
    
    if (nombre && telefono && fecha && barbero && hora) {
        mostrarMensaje('¡Cita reservada! Nos vemos el ' + fecha + ' a las ' + hora);
        formularioReserva.reset();
        cerrarModal();
    } else {
        mostrarMensaje('Por favor completa todos los campos');
    }
});

const formularioContacto = document.getElementById('formulario-contacto');

formularioContacto.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const mensaje = document.getElementById('mensaje').value;
    
    if (nombre && email && telefono && mensaje) {
        mostrarMensaje('¡Mensaje enviado! Te contactaremos pronto');
        formularioContacto.reset();
    } else {
        mostrarMensaje('Por favor completa todos los campos');
    }
});

// Selecciona todos los enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(function(enlace) {
    enlace.addEventListener('click', function(e) {
        e.preventDefault();
        
        const destino = this.getAttribute('href');
        const elemento = document.querySelector(destino);
        
        if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

console.log('✅ Barbería cargada correctamente');