// Importación de express y router
const express = require('express'); // Importa el módulo Express
const router = express.Router(); // Crea un router para manejar las rutas
module.exports = router; // Exporta el router para que pueda ser utilizado en otros archivos

// Importación de la conexión a la base de datos
const { connection } = require('./connection'); // Importa la conexión a la base de datos desde el archivo connection.js

// Método POST para el login
router.post('/login', (req, res) => {
    // Extrae los campos 'usuario' y 'contraseña' del cuerpo de la solicitud
    const { usuario, contraseña } = req.body;

    // Verifica si ambos campos no esten vacios
    if (!usuario || !contraseña) {
        res.status(400).json({ error: 'Por favor, llena todos los campos' }); 
        return;
    }

    // Consulta para verificar si el usuario existe en la base de datos
    const userQuery = 'SELECT * FROM usuarios_proveedor WHERE usuario = ?';
    connection.query(userQuery, [usuario], (err, results) => {
        if (err) {
            // Muestra el error si ocurre un problema con la consulta
            console.error('Error ejecutando la consulta:', err); 
            res.status(500).json({ error: 'Error en el servidor' }); 
            return;
        }

        // Verifica si el usuario existe en la base de datos
        if (results.length === 0) {
            // Responde con un error 401 si el usuario no existe
            res.status(401).json({ error: 'Usuario incorrecto' }); 
        } else {
            // Toma el primer resultado de la consulta (debería haber solo uno)
            const user = results[0]; 
            // Verifica si la contraseña proporcionada coincide con la almacenada en la base de datos
            if (user.contraseña === contraseña) {
                // Establece la sesión del usuario en la solicitud
                req.session.user = user; 

                // En una constante se almacena el nombre completo del usuario
                const nombreCompleto = `${user.primer_nombre} ${user.segundo_nombre} ${user.primer_apellido} ${user.segundo_apellido}`; 

                // Consulta para insertar un registro de inicio de sesión en la base de datos
                const insertQuery = 'INSERT INTO login_proveedor (IdUsuarioP, FechaHoraLogin) VALUES (?, NOW())';
                connection.query(insertQuery, [user.IdUsuarioP], (insertErr) => {
                    if (insertErr) {
                        // Muestra el error si hay un problema con la inserción
                        console.error('Error al insertar en login_proveedor:', insertErr); 
                        res.status(500).json({ error: 'Error en el servidor al registrar el login' });
                        return;
                    }
                    // Responde con un mensaje de bienvenida si el inicio de sesión es exitoso
                    res.json({ message: `Bienvenido ${nombreCompleto}` }); 


                });

                // Establece la sesión del usuario en la solicitud
                req.session.user = user;
                req.session.nombreCompleto = nombreCompleto; // Guarda el nombre completo en la sesión
                req.session.IdProveedor = user.IdProveedor; // Almacenar el IdProveedor en la sesión

            } else {
                // Muestra un error si la constraseña es incorrecta
                res.status(401).json({ error: 'Contraseña incorrecta' }); 
            }
        }
    });
});


// Ruta para obtener el logo del proveedor
router.get('/proveedor/logo', (req, res) => {
    // Verifica si el usuario está autenticado
    if (!req.session.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtiene el IdProveedor del usuario autenticado
    const idProveedor = req.session.user.IdProveedor;

    // Consulta para obtener el logo del proveedor
    const query = 'SELECT logo FROM proveedores WHERE IdProveedores = ?';
    connection.query(query, [idProveedor], (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        // Obtiene el logo y lo convierte a base64
        const logo = results[0].logo;
        const base64Logo = logo.toString('base64');
        res.json({ logo: `data:image/png;base64,${base64Logo}` });
    });
});


// Ruta para verificar la autenticación del usuario
router.get('/verify', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});