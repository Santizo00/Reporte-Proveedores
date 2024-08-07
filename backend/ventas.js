const express = require('express');
const router = express.Router();
const { connection1 } = require('./connection');

router.post('/generarReporte', (req, res) => {
    const { FechaInicio, FechaFin, page = 1 } = req.body;
    const idProveedor = req.session.user ? req.session.user.IdProveedor : null; // Obtiene el IdProveedor de la sesión

    if (!idProveedor) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const limit = 1000; // Número de registros por página
    const offset = (page - 1) * limit;

    const query = `
        SELECT 
            sucursales.NombreSucursal, 
            ventasdiariasglobales_copy1.Upc, 
            ventasdiariasglobales_copy1.Fecha, 
            ventasdiariasglobales_copy1.Descripcion, 
            ventasdiariasglobales_copy1.Cantidad, 
            ventasdiariasglobales_copy1.MontoTotal, 
            SUM(ventasdiariasglobales_copy1.MontoTotal) AS MontoTotalGeneral, 
            categorias.Nombre AS Categoria, 
            subcategorias.Nombre AS SubCategoria, 
            productospaquetes.Cantidad AS UnidadesPorFardo
        FROM 
            ventasdiariasglobales_copy1
        INNER JOIN 
            sucursales ON ventasdiariasglobales_copy1.IdSucursal = sucursales.idSucursal 
        LEFT JOIN 
            categorias ON ventasdiariasglobales_copy1.IdCategoria = categorias.Id
        LEFT JOIN 
            subcategorias ON ventasdiariasglobales_copy1.IdSubCategoria = subcategorias.Id
        LEFT JOIN 
            productospaquetes ON ventasdiariasglobales_copy1.Upc = productospaquetes.UPC
        WHERE 
            ventasdiariasglobales_copy1.Fecha >= ? 
            AND ventasdiariasglobales_copy1.Fecha <= ? 
            AND ventasdiariasglobales_copy1.IdProveedor = ?
        GROUP BY 
            ventasdiariasglobales_copy1.Upc, 
            ventasdiariasglobales_copy1.IdSucursal
        LIMIT ? OFFSET ?`;

    connection1.query(query, [FechaInicio, FechaFin, idProveedor, limit, offset], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ error: 'Error al generar el reporte' });
        }
        res.json(results);
    });
});

router.post('/obtenerFiltros', (req, res) => {
    const { FechaInicio, FechaFin } = req.body;
    const idProveedor = req.session.user ? req.session.user.IdProveedor : null;

    if (!idProveedor) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const query = `
        SELECT 
            sucursales.NombreSucursal AS Sucursal,
            departamentos.Nombre AS Departamento,
            categorias.Nombre AS Categoria,
            subcategorias.Nombre AS SubCategoria,
            SUM(ventasdiariasglobales_copy1.MontoTotal) AS TotalVendido
        FROM 
            ventasdiariasglobales_copy1
        INNER JOIN 
            sucursales ON ventasdiariasglobales_copy1.IdSucursal = sucursales.idSucursal
        LEFT JOIN 
            categorias ON ventasdiariasglobales_copy1.IdCategoria = categorias.Id
        LEFT JOIN 
            subcategorias ON ventasdiariasglobales_copy1.IdSubCategoria = subcategorias.Id
        LEFT JOIN 
            departamentos ON ventasdiariasglobales_copy1.IdDepartamento = departamentos.Id
        WHERE 
            ventasdiariasglobales_copy1.Fecha >= ? 
            AND ventasdiariasglobales_copy1.Fecha <= ? 
            AND ventasdiariasglobales_copy1.IdProveedor = ?
        GROUP BY 
            sucursales.NombreSucursal, departamentos.Nombre, categorias.Nombre, subcategorias.Nombre ORDER BY TotalVendido desc
    `;

    connection1.query(query, [FechaInicio, FechaFin, idProveedor], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ error: 'Error al obtener los filtros' });
        }
        res.json(results);
    });
});



module.exports = router;
