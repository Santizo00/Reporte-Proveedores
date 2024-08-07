// Verificar la sesión al cargar la página y cada 5 minutos
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    setInterval(verificarSesion, 300000); // 5 minutos
    
    // Verificar la autenticación del usuario en el cliente
    fetch('/auth/verify')
    .then(response => response.json())
    .then(data => {
        if (!data.authenticated) {
            window.location.href = '/';
        } else {
            // Obtener el nombre completo del usuario
            fetch('/auth/nombre')
            .then(response => response.json())
            .then(nombreData => {
                if (nombreData.nombreCompleto) {
                    document.getElementById('nombreCompleto').textContent = nombreData.nombreCompleto;
                }
            })
            .catch(error => {
                console.error('Error al obtener el nombre completo:', error);
            });

            // Obtener el logo del proveedor
            fetch('/auth/proveedor/logo')
            .then(response => response.json())
            .then(logoData => {
                if (logoData.logo) {
                    document.getElementById('logoProveedor').src = logoData.logo;
                }
            })
            .catch(error => {
                console.error('Error al obtener el logo del proveedor:', error);
            });
        }
    })
    .catch(error => {
        console.error('Error al verificar la autenticación:', error);
        window.location.href = '/';
    });

    // Carga el contenido del navbar
    fetch('views/navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-placeholder').innerHTML = data;
            
            // Configurar el evento de logout
            document.getElementById('logout').addEventListener('click', function (e) {
                e.preventDefault();
                fetch('/logout', {
                    method: 'GET',
                    headers: { 'Cache-Control': 'no-cache' }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        localStorage.setItem('logout', 'true');
                        // Borra el historial del navegador
                        window.history.pushState(null, null, '/');
                        window.history.pushState(null, null, '/');
                        window.history.back();
                        window.location.replace('/');
                    } else {
                        console.error('Error al cerrar sesión:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error al cerrar sesión:', error);
                });
            });

            // Cargar el tema desde localStorage
            let currentTheme = localStorage.getItem('theme') || 'css/claro.css';
            document.getElementById('themeStylesheet').setAttribute('href', currentTheme);

            // Establecer la clase de la tabla según el tema cargado
            let dataTable = document.getElementById('dataTable');
            if (dataTable) {
                if (currentTheme === 'css/claro.css') {
                    dataTable.className = 'table table-striped table-light table mb-0';
                } else {
                    dataTable.className = 'table table-striped table-dark table mb-0';
                }
            }
            document.getElementById('buttonTheme').addEventListener('click', function () {
                let themeStylesheet = document.getElementById('themeStylesheet');
                let currentTheme = themeStylesheet.getAttribute('href');
                let newTheme = currentTheme === 'css/claro.css' ? 'css/oscuro.css' : 'css/claro.css';
            
                // Cambiar el tema
                themeStylesheet.setAttribute('href', newTheme);
            
                // Guardar la preferencia en localStorage
                localStorage.setItem('theme', newTheme);
            
                // Cambiar la clase de la tabla según el tema
                if (dataTable) {
                    if (newTheme === 'css/claro.css') {
                        dataTable.className = 'table table-striped table-light table mb-0';
                    } else {
                        dataTable.className = 'table table-striped table-dark table mb-0';
                    }
                }
            
                // Actualizar las gráficas si existen
                if (window.actualizarGraficas) {
                    window.actualizarGraficas();
                }
            });
            
            
        })
        .catch(error => {
            console.error('Error al cargar el navbar:', error);
    });

    // Verificación inicial de logout
    (function() {
        if (localStorage.getItem('logout') === 'true') {
            localStorage.removeItem('logout');
            window.location.replace('/');
            // Borra el historial del navegador
            window.history.pushState(null, null, '/');
            window.history.pushState(null, null, '/');
            window.history.back();
        }
    })();

    function verificarSesion() {
        return fetch('/auth/nombre', { 
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('No autenticado');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error de autenticación:', error);
            window.location.replace('/');
        });
    }

    function forzarRecarga() {
        verificarSesion();
    }

    // Detectar navegación hacia atrás
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            forzarRecarga();
        }
    });
});



