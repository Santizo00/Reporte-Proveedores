// Importación de las librerías necesarias
// Express es un framework para Node.js que simplifica la creación de servidores web
const express = require('express'); 
// Path proporciona utilidades para trabajar con rutas de archivos y directorios
const path = require('path'); 
// Express-session gestiona las sesiones de usuario en la aplicación
const session = require('express-session'); 
// Crea una instancia de la aplicación Express
const app = express(); 
// Define el puerto en el que el servidor escuchará las solicitudes
const PORT = 3000; 

// Permite a Express procesar solicitudes con datos JSON
app.use(express.json()); 
// Permite a Express procesar datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true })); 

// Configurar la sesión
app.use(session({
    // Clave secreta utilizada para firmar la cookie de sesión
    secret: 'laBodegona24451.1988', 
    // Evita que la sesión se vuelva a guardar en cada solicitud, si no ha sido modificada
    resave: false, 
    // Guarda sesiones no inicializadas (nuevas sesiones sin datos)
    saveUninitialized: true,
    // La cookie de sesión no se transmitirá de forma segura (HTTPS) en este caso
    cookie: { secure: false } 
}));

// Middleware para servir archivos estáticos (CSS, JS, imágenes, etc.) para acceder a ellos con ../
app.use(express.static(path.join(__dirname, '..')));

// Ruta para dirigir la página principal (login)
app.get('/', (req, res) => {
    // Destruir la sesión si existe
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destruyendo la sesión:', err);
            }
            // Limpia la cookie de sesión
            res.clearCookie('connect.sid'); 
            // Envía el archivo HTML de login después de destruir la sesión
            res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
        });
    } else {
        // Si no hay sesión, simplemente envía el archivo HTML de login
        res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
    }
});

// Ruta para obtener el nombre completo y el IdProveedor del usuario
app.get('/auth/nombre', (req, res) => {
    if (req.session.nombreCompleto && req.session.IdProveedor) {
        res.json({
            nombreCompleto: req.session.nombreCompleto,
            IdProveedor: req.session.IdProveedor
        });
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
});

// Middleware para verificar la sesión
const verificarSesion = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
};

// Aplicar el middleware a todas las rutas protegidas
app.use(['/menu', '/categorias', '/inventario', '/ventasgeneral', '/ventassucursal'], verificarSesion);


app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'menu.html'));
});

app.get('/categorias', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'categorias.html'));
});

app.get('/inventario', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'inventario.html')); 
});

app.get('/ventasgeneral', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'ventasgeneral.html'));
});

app.get('/ventassucursal', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'ventassucursal.html')); 
});


app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Sesión cerrada exitosamente' });
    });
});

// Importar y usar el router de autenticación para manejar las rutas relacionadas con la autenticación
const authRouter = require('./autenticacion');
// Usa el router de autenticación para las rutas que comienzan con '/auth'
app.use('/auth', authRouter);

const ventasRouter = require('../backend/ventas');
app.use('/backend', ventasRouter);


// Iniciar el servidor
app.listen(PORT, () => {
    // Muestra un mensaje en la consola
    console.log(`Servidor iniciado en http://localhost:${PORT}`); 
});

// Middleware para controlar el caché
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};

// Aplicar el middleware a todas las rutas
app.use(noCache);
