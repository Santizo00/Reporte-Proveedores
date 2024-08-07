document.addEventListener('DOMContentLoaded', function () {
    // Cargar el tema desde localStorage
    let currentTheme = localStorage.getItem('theme') || 'css/claro.css';
    document.getElementById('themeStylesheet').setAttribute('href', currentTheme);

    // Añadir el evento de clic al botón del tema
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
    });

    // Verificar si el usuario ha cerrado sesión
    if (localStorage.getItem('logout') === 'true') {
        localStorage.removeItem('logout');
        // Borra el historial del navegador
        history.pushState(null, null, location.href);
        window.addEventListener('popstate', function () {
            history.pushState(null, null, location.href);
        });
    }

    // Función para mostrar cuadros de diálogo con SweetAlert2
    function showAlert(title, text, icon = 'info') {
        Swal.fire({
            title: title,
            html: text,
            icon: icon,
            confirmButtonText: 'OK'
        });
    }

    //Se maneja el submit del formulario con id loginForm
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        // Prevenir el envío del formulario
        e.preventDefault(); 

        //Obtiene los datos y los guarda en variables
        const usuario = document.getElementById('usuario').value;
        const contraseña = document.getElementById('contraseña').value;

        //Valida que el usuario y contraseña no esten vacios
        if (!usuario || !contraseña) {
            showAlert('Error', 'Por favor, llena todos los campos', 'error');
            return;
        }

        fetch('/auth/login', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ usuario, contraseña }) 
        })
        .then(response => response.json()) 
        .then(data => {
            if (data.error) { 
                showAlert('Error', data.error, 'error'); 
            } else {
                // Guardar la sesión en localStorage
                localStorage.setItem('sesion', 'true');
                window.location.replace('/menu');
                

            }
        })
        .catch(error => {
            console.error('Error:', error); 
            showAlert('Error', 'Hubo un problema con la solicitud', 'error');
        });
    });

    // Verificar si el usuario ha cerrado sesión
    if (localStorage.getItem('logout') === 'true') {
        localStorage.removeItem('logout');
        history.pushState(null, null, location.href);
        window.addEventListener('popstate', function () {
            history.pushState(null, null, location.href);
        });
    }
});