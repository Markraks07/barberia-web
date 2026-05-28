// Obtén el modal
const modal = document.getElementById('modal-reserva');

// Obtén el botón "Reservar cita" (es el primer <a> que dice "Reservar cita")
const btnReservar = document.querySelector('a[href="#modal-reserva"]');  // O busca por texto

// Obtén el botón close (la X)
const closeBtn = document.querySelector('.close');

// Función para abrir
function abrirModal(e) {
    e.preventDefault();  // Evita el scroll
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
    div.className = 'form-message ' + tipo;  // 'success' o 'error'
    
    // Ocultarlo después de 5 segundos
    setTimeout(function() {
        div.className = 'form-message';
    }, 5000);
}

const formularioReserva = document.getElementById('formulario-reserva');

formularioReserva.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtén los valores
    const nombre = document.getElementById('nombre-reserva').value;
    const telefono = document.getElementById('telefono-reserva').value;
    const fecha = document.getElementById('fecha-reserva').value;
    const barbero = document.getElementById('barbero').value;
    const hora = document.getElementById('hora-reserva').value;
    
    // Valida (comprueba que no estén vacíos)
    if (nombre && telefono && fecha && barbero && hora) {
        // Si está todo bien:
        mostrarMensaje('¡Cita reservada! Nos vemos el ' + fecha + ' a las ' + hora);
        formularioReserva.reset();  // Limpia el formulario
        cerrarModal();  // Cierra el modal
    } else {
        mostrarMensaje('Por favor completa todos los campos');
    }
});

const formularioContacto = document.getElementById('formulario-contacto');

formularioContacto.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtén los valores
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const mensaje = document.getElementById('mensaje').value;
    
    // Valida
    if (nombre && email && telefono && mensaje) {
        mostrarMensaje('¡Mensaje enviado! Te contactaremos pronto');
        formularioContacto.reset();
    } else {
        mostrarMensaje('Por favor completa todos los campos');
    }
});

// Selecciona todos los enlaces internos (que empiezan con #)
document.querySelectorAll('a[href^="#"]').forEach(function(enlace) {
    enlace.addEventListener('click', function(e) {
        e.preventDefault();  // Evita el comportamiento por defecto
        
        // Obtén el id de destino
        const destino = this.getAttribute('href');
        const elemento = document.querySelector(destino);
        
        // Scroll suave
        if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

function mostrarMensaje(texto, tipo) {
    const div = document.getElementById('mensaje-respuesta');
    div.textContent = texto;
    div.className = 'form-message ' + tipo;  // 'success' o 'error'
    
    // Ocultarlo después de 5 segundos
    setTimeout(function() {
        div.className = 'form-message';
    }, 5000);
}