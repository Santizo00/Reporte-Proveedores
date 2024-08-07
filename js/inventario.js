document.addEventListener('DOMContentLoaded', function() { 
    // Maneja el evento de click del botón con id logout
    document.getElementById('logout').addEventListener('click', function() {
        // Realiza una solicitud GET para cerrar sesión
        fetch('/logout')
            .then(response => {
                if (response.ok) {
                    // Limpia el historial del navegador
                    window.history.pushState(null, null, '/');
                    // Redirige al login
                    window.location.href = '/';
                } else {
                    console.error('Error al cerrar sesión');
                }
            })
            .catch(error => {
                console.error('Error al cerrar sesión:', error);
            });
    });

    fetch('navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar-placeholder').innerHTML = data;
    });
});