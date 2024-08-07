//Importacion de libreria de mysql
const mysql = require('mysql');//Conexion a la base de datos

//Se crea la constante connection que es la que se va a utilizar para conectarse a la base de datos
const connection = mysql.createConnection({
    host: '192.168.110.150', //IP de la base de datos
    database: 'base_pruebas', //Nombre de la base de datos
    user: 'reportes', //Usuario de la base de datos
    password: 'sistemas' //Contraseña de la base de datos
});

//Se crea la constante connection que es la que se va a utilizar para conectarse a la base de datos
const connection1 = mysql.createConnection({
    host: '172.30.1.25', //IP de la base de datos
    database: 'Sinc_Gestion', //Nombre de la base de datos
    user: 'reportes', //Usuario de la base de datos
    password: 'laBodegona2445.1988' //Contraseña de la base de datos
});



//Testea la conexion 
connection.connect((err) => {
    if (err) {
        console.error('No se pudo conectar a la base de datos:', err);
        return;
    }
});

//Exporta la conexion para ser utilizada en otros archivos
module.exports = {
    connection,
    connection1
};