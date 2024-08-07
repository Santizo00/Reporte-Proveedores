document.addEventListener('DOMContentLoaded', function() { 
    const today = new Date().toISOString().split('T')[0]; // Obtener la fecha de hoy en formato YYYY-MM-DD
    document.getElementById('InicioGeneral').value = today;
    document.getElementById('FinalGeneral').value = today;


    // Función para mostrar cuadros de diálogo con SweetAlert2
    function showAlert(title, text, icon = 'info') {
        Swal.fire({
            title: title,
            html: text,
            icon: icon,
            confirmButtonText: 'OK'
        });
    }

    // Función para mostrar el spinner
    function showSpinner() {
        Swal.fire({
            title: 'Generando reporte',
            html: '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>',
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
            }
        });
    }
    
    // Función para ocultar el spinner
    function hideSpinner() {
        Swal.close();
    }

    let allData = []; // Variable para almacenar todos los datos
    let currentPage = 1;
    const recordsPerPage = 100;
    
    function fetchReport() {
        let FechaInicio = document.getElementById('InicioGeneral').value;
        let FechaFin = document.getElementById('FinalGeneral').value;
    
        if (FechaInicio === '' || FechaFin === '') {
            showAlert('Error', 'Debe seleccionar una fecha de inicio y una fecha de fin.', 'error');
            return;
        } else if (FechaInicio > FechaFin) {
            showAlert('Error', 'La fecha de inicio no puede ser mayor a la fecha de fin.', 'error');
            return; 
        } else {
            showSpinner(); // Mostrar el spinner
    
            Promise.all([
                fetch('/backend/generarReporte', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ FechaInicio, FechaFin })
                })
                .then(response => response.json()),
    
                fetch('/backend/obtenerFiltros', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ FechaInicio, FechaFin })
                })
                .then(response => response.json())
            ])
            .then(([reportData, filterData]) => {
                hideSpinner(); // Ocultar el spinner
                document.getElementById('graficasGeneral').style.display = 'block';
                document.getElementById('exportarGeneral').style.display = 'block';
    
                if (reportData.error) {
                    showAlert('Error', reportData.error, 'error');
                } else {
                    allData = reportData; // Almacenar todos los datos
                    currentPage = 1; // Reiniciar a la primera página
                    updateTable();    
    
                    // Sumar el MontoTotalGeneral
                    const totalGeneral = reportData.reduce((sum, row) => sum + (row.MontoTotal || 0), 0);
                    document.getElementById('totalGeneral').innerText = `${totalGeneral.toFixed(2)}`;
                    
                    document.getElementById('vistapaginacion').style.display = allData.length > recordsPerPage ? 'block' : 'none';
                }
    
                if (filterData.error) {
                    showAlert('Error', filterData.error, 'error');
                } else {
                    llenarSelectores(filterData);
                }
                verDatos(filterData);
            })
            .catch(error => {
                hideSpinner(); // Ocultar el spinner
                console.error('Error al generar el reporte:', error);
                showAlert('Error', 'Hubo un error al generar el reporte.', 'error'); 
            });
        }
    }
    
    function updateTable() {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = ''; // Limpiar la tabla

        const start = (currentPage - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const paginatedData = allData.slice(start, end);

        paginatedData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.NombreSucursal || ''}</td>
                <td>${row.Upc || ''}</td>
                <td>${row.Descripcion || ''}</td>
                <td>${row.Cantidad || ''}</td>
                <td>${row.MontoTotal || ''}</td>
                <td>${row.Categoria || ''}</td>
                <td>${row.SubCategoria || ''}</td>
                <td>${row.UnidadesPorFardo || ''}</td>
            `;
            tbody.appendChild(tr);
        });

        updatePaginationControls();
    }

    function updatePaginationControls() {
        const totalPages = Math.ceil(allData.length / recordsPerPage);
        document.getElementById('pageIndicator').textContent = `Página ${currentPage} de ${totalPages}`;
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    document.getElementById('reporteGeneral').addEventListener('click', function (e) {
        fetchReport();
    });

    document.getElementById('limpiarGeneral').addEventListener('click', function (e) {
        document.getElementById('InicioGeneral').value = today;
        document.getElementById('FinalGeneral').value = today;
        document.getElementById('graficoContainer').style.display = 'none';
        document.getElementById('tablaContainer').style.display = 'block';
        
        document.getElementById('exportarGeneral').style.display = 'none';
        document.getElementById('graficasGeneral').style.display = 'none';
        document.getElementById('tablaGeneral').style.display = 'none';

        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = ''; // Limpiar la tabla
        
        allData = [];
        updatePaginationControls();
    });

    document.getElementById('prevPage').addEventListener('click', function (e) {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });

    document.getElementById('nextPage').addEventListener('click', function (e) {
        const totalPages = Math.ceil(allData.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });

    document.getElementById('exportarGeneral').addEventListener('click', function() {
        exportToCSV(allData, 'reporte.csv');
    });

    function exportToCSV(data, filename) {
        const csvRows = [];
        const headers = ["NombreSucursal", "Upc", "Descripcion", "Cantidad", "MontoTotal", "Categoria", "SubCategoria", "UnidadesPorFardo"];
        csvRows.push(headers.join(','));

        data.forEach(row => {
            const values = [
                row.NombreSucursal || '',
                row.Upc || '',
                row.Descripcion || '',
                row.Cantidad || '',
                row.MontoTotal || '',
                row.Categoria || '',
                row.SubCategoria || '',
                row.UnidadesPorFardo || ''
            ];
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    document.getElementById('graficasGeneral').addEventListener('click', function() {
        document.getElementById('tablaContainer').style.display = 'none';
        document.getElementById('graficasGeneral').style.display = 'none';
        document.getElementById('tablaGeneral').style.display = 'block';
        document.getElementById('graficoContainer').style.display = 'block';
    });
    
    // Función para volver a mostrar la tabla
    document.getElementById('tablaGeneral').addEventListener('click', function() {
        document.getElementById('tablaContainer').style.display = 'block';
        document.getElementById('graficoContainer').style.display = 'none';
        document.getElementById('graficasGeneral').style.display = 'block';
        document.getElementById('tablaGeneral').style.display = 'none';
    });

    function obtenerTemaActual() {
        const temaActual = document.getElementById('themeStylesheet').getAttribute('href');
        return temaActual.includes('claro') ? 'claro' : 'oscuro';
    }

    function verDatos(data) {
        const sucursalTotales = {};
        const departamentoTotales = {};
        const categoriaTotales = {};
        const subcategoriaTotales = {};
    
        data.forEach(item => {
            sucursalTotales[item.Sucursal] = (sucursalTotales[item.Sucursal] || 0) + item.TotalVendido;
            departamentoTotales[item.Departamento] = (departamentoTotales[item.Departamento] || 0) + item.TotalVendido;
            categoriaTotales[item.Categoria] = (categoriaTotales[item.Categoria] || 0) + item.TotalVendido;
            subcategoriaTotales[item.SubCategoria] = (subcategoriaTotales[item.SubCategoria] || 0) + item.TotalVendido;
        });

        function crearGraficas() {
            const temaActual = obtenerTemaActual();
            const crearGraficoPastel = temaActual === 'claro' ? crearGraficoDePastelClaro : crearGraficoDePastelOscuro;
            const crearGraficoBar = temaActual === 'claro' ? crearGraficoBarClaro : crearGraficoBarOscuro;
    
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(() => {
                crearGraficoPastel('ventasPorDepartamento', Object.keys(departamentoTotales), Object.values(departamentoTotales), 'Gráfica por Departamentos');
                crearGraficoPastel('ventasPorCategoria', Object.keys(categoriaTotales), Object.values(categoriaTotales), 'Gráfica por Categorías');
                
                const sucursalData = Object.entries(sucursalTotales).sort((a, b) => b[1] - a[1]);
                const subcategoriaData = Object.entries(subcategoriaTotales).sort((a, b) => b[1] - a[1]);
                
                crearGraficoBar('ventasPorSucursal', sucursalData.map(item => item[0]), sucursalData.map(item => item[1]), 'Gráfica por Sucursal');
                crearGraficoBar('ventasPorSubcategoria', subcategoriaData.map(item => item[0]), subcategoriaData.map(item => item[1]), 'Gráfica por Subcategorías');
            });
        }

        document.getElementById('graficasGeneral').addEventListener('click', crearGraficas);

        // Exponer la función crearGraficas para que pueda ser llamada desde fuera
        window.actualizarGraficas = crearGraficas;
    }

    

    function crearGraficoDePastelClaro(elementId, labels, data, titulo, textColor = 'black', textColor1 = 'black') {
        const total = data.reduce((sum, value) => sum + value, 0);
        const chartData = [['Etiqueta', 'Total Vendido']];
        
        labels.forEach((label, index) => {
            const value = data[index];
            const percentage = (value / total * 100).toFixed(2);
            chartData.push([`${label} Q.${value.toLocaleString()} (${percentage}%)`, value]);
        });
    
        const dataTable = google.visualization.arrayToDataTable(chartData);
    
        const options = {
            title: titulo,
            backgroundColor: 'transparent',
            width: 700,
            height: 500,
            pieSliceText: 'none',
            tooltip: { isHtml: true, textStyle: { color: textColor } },
            legend: {
                position: 'right',
                textStyle: {
                    fontSize: 12,
                    color: textColor1,
                }
            },
            is3D: true,
            titleTextStyle: {
                color: textColor1 // Add textColor to the title
            }
        };
    
        const formatter = new google.visualization.NumberFormat({
            prefix: 'Q.',
            negativeColor: 'red',
            negativeParens: true,
        });
        formatter.format(dataTable, 1);
    
        const chart = new google.visualization.PieChart(document.getElementById(elementId));
    
        // Custom Tooltip
        google.visualization.events.addListener(chart, 'onmouseover', function(e) {
            const tooltipContent = `
                <div style="font-size: 14px; line-height: 1.2; color: ${textColor};">
                <br>
                    <strong>${labels[e.row]}</strong><br>
                    Total vendido: <strong>Q.${data[e.row].toLocaleString()} (${(data[e.row] / total * 100).toFixed(2)}%)</strong>
                </div>`;
            const tooltip = document.getElementsByClassName('google-visualization-tooltip')[0];
            if (tooltip) {
                tooltip.innerHTML = tooltipContent;
                tooltip.style.padding = '5px'; // Adjust padding to remove extra space
            }
        });
    
        google.visualization.events.addListener(chart, 'onmouseout', function() {
            const tooltip = document.getElementsByClassName('google-visualization-tooltip')[0];
            if (tooltip) {
                tooltip.innerHTML = '';
            }
        });
    
        chart.draw(dataTable, options);
    }
    

    function crearGraficoDePastelOscuro(elementId, labels, data, titulo, textColor = 'black', textColor1 = 'white') {
        const total = data.reduce((sum, value) => sum + value, 0);
        const chartData = [['Etiqueta', 'Total Vendido']];
        
        labels.forEach((label, index) => {
            const value = data[index];
            const percentage = (value / total * 100).toFixed(2);
            chartData.push([`${label} Q.${value.toLocaleString()} (${percentage}%)`, value]);
        });
    
        const dataTable = google.visualization.arrayToDataTable(chartData);
    
        const options = {
            title: titulo,
            backgroundColor: 'transparent',
            width: 700,
            height: 500,
            pieSliceText: 'none',
            tooltip: { isHtml: true, textStyle: { color: textColor } },
            legend: {
                position: 'right',
                textStyle: {
                    fontSize: 12,
                    color: textColor1,
                }
            },
            is3D: true,
            titleTextStyle: {
                color: textColor1 // Add textColor to the title
            }
        };
    
        const formatter = new google.visualization.NumberFormat({
            prefix: 'Q.',
            negativeColor: 'red',
            negativeParens: true,
        });
        formatter.format(dataTable, 1);
    
        const chart = new google.visualization.PieChart(document.getElementById(elementId));
    
        // Custom Tooltip
        google.visualization.events.addListener(chart, 'onmouseover', function(e) {
            const tooltipContent = `
                <div style="font-size: 14px; line-height: 1.2; color: ${textColor};">
                <br>
                    <strong>${labels[e.row]}</strong><br>
                    Total vendido: <strong>Q.${data[e.row].toLocaleString()} (${(data[e.row] / total * 100).toFixed(2)}%)</strong>
                </div>`;
            const tooltip = document.getElementsByClassName('google-visualization-tooltip')[0];
            if (tooltip) {
                tooltip.innerHTML = tooltipContent;
                tooltip.style.padding = '5px'; // Adjust padding to remove extra space
            }
        });
    
        google.visualization.events.addListener(chart, 'onmouseout', function() {
            const tooltip = document.getElementsByClassName('google-visualization-tooltip')[0];
            if (tooltip) {
                tooltip.innerHTML = '';
            }
        });
    
        chart.draw(dataTable, options);
    }


    function crearGraficoBarClaro(elementId, labels, data, titulo, textColor1 = 'black') {
        const total = data.reduce((sum, value) => sum + value, 0);
    
        // Ordenar los datos de mayor a menor
        const sortedData = data.map((value, index) => ({ label: labels[index], value }))
        .sort((a, b) => b.value - a.value);

        const sortedLabels = sortedData.map(item => `${item.label}  `);
        const sortedValues = sortedData.map(item => item.value);
    
        const reversedLabels = sortedLabels.reverse();
        const reversedValues = sortedValues.reverse();

        const trace = {
            x: reversedValues,
            y: reversedLabels,
            color: textColor1,
            type: 'bar',
            orientation: 'h',
            text: sortedLabels.map((label, index) => `${label}<br>Total vendido: Q.${sortedValues[index].toLocaleString()} (${(sortedValues[index] / total * 100).toFixed(2)}%)`),
            hoverinfo: 'text',
            hoverlabel: {
                bgcolor: 'white',
                font: { color: 'black' }
            },
            marker: {
                color: '#3366cc',
                width: 1
            }
        };
    
        const layout = {
            title: {
                text: titulo,
                font: {
                    color: textColor1
                }
            },
            xaxis: {
                title: `Total Vendido: Q.${total.toLocaleString()}`,
                color: textColor1,
                gridcolor: textColor1,
                linecolor: textColor1,
                zerolinecolor: textColor1
            },
            yaxis: {
                automargin: true,
                tickfont: {
                    size: 14
                },
                color: textColor1,
                gridcolor: textColor1,
                linecolor: textColor1,
                zerolinecolor: textColor1
            },
            margin: {
                l: 250,  // Aumentar el margen izquierdo para etiquetas más largas
                r: 250,
                t: 50,
                b: 50
            },
            width: 1360,  // Ancho del gráfico
            height: 1200,  // Altura del gráfico
            plot_bgcolor: 'rgba(0, 0, 0, 0)', // Fondo transparente
            paper_bgcolor: 'rgba(0, 0, 0, 0)'  // Fondo transparente
        };
    
        const config = {
            displayModeBar: false  // Ocultar la barra de herramientas
        };
    
        Plotly.newPlot(elementId, [trace], layout, config);
    }

    function crearGraficoBarOscuro(elementId, labels, data, titulo, textColor1 = 'white') {
        const total = data.reduce((sum, value) => sum + value, 0);
    
        // Ordenar los datos de mayor a menor
        const sortedData = data.map((value, index) => ({ label: labels[index], value }))
        .sort((a, b) => b.value - a.value);

        const sortedLabels = sortedData.map(item => `${item.label}  `);
        const sortedValues = sortedData.map(item => item.value);
    
        const reversedLabels = sortedLabels.reverse();
        const reversedValues = sortedValues.reverse();

        const trace = {
            x: reversedValues,
            y: reversedLabels,
            color: textColor1,
            type: 'bar',
            orientation: 'h',
            text: sortedLabels.map((label, index) => `${label}<br>Total vendido: Q.${sortedValues[index].toLocaleString()} (${(sortedValues[index] / total * 100).toFixed(2)}%)`),
            hoverinfo: 'text',
            hoverlabel: {
                bgcolor: 'white',
                font: { color: 'black' }
            },
            marker: {
                color: '#3366cc',
                width: 1
            }
        };
    
        const layout = {
            title: {
                text: titulo,
                font: {
                    color: textColor1
                }
            },
            xaxis: {
                title: `Total Vendido: Q.${total.toLocaleString()}`,
                color: textColor1,
                gridcolor: textColor1,
                linecolor: textColor1,
                zerolinecolor: textColor1
            },
            yaxis: {
                automargin: true,
                tickfont: {
                    size: 14
                },
                color: textColor1,
                gridcolor: textColor1,
                linecolor: textColor1,
                zerolinecolor: textColor1
            },
            margin: {
                l: 250,  // Aumentar el margen izquierdo para etiquetas más largas
                r: 250,
                t: 50,
                b: 50
            },
            width: 1360,  // Ancho del gráfico
            height: 1200,  // Altura del gráfico
            plot_bgcolor: 'rgba(0, 0, 0, 0)', // Fondo transparente
            paper_bgcolor: 'rgba(0, 0, 0, 0)'  // Fondo transparente
        };
    
        const config = {
            displayModeBar: false  // Ocultar la barra de herramientas
        };
    
        Plotly.newPlot(elementId, [trace], layout, config);
    }

    function llenarSelectores(data) {
        const sucursales = new Set();
        const departamentos = new Set();
        const categorias = new Set();
        const subcategorias = new Set();
    
        // Agregar los datos a los conjuntos
        data.forEach(row => {
            if (row.Sucursal) sucursales.add(row.Sucursal);
            if (row.Departamento) departamentos.add(row.Departamento);
            if (row.Categoria) categorias.add(row.Categoria);
            if (row.SubCategoria) subcategorias.add(row.SubCategoria);
        });
    
        const sucursalSelect = document.getElementById('sucursalGeneral');
        const departamentoSelect = document.getElementById('departamentoGeneral');
        const categoriaSelect = document.getElementById('categoriaGeneral');
        const subcategoriaSelect = document.getElementById('subcategoriaGeneral');
    
        sucursalSelect.innerHTML = '';  
        departamentoSelect.innerHTML = '';  
        categoriaSelect.innerHTML = '';
        subcategoriaSelect.innerHTML = '';
    
        // Llenar los selectores con los valores únicos
        sucursales.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal;
            option.textContent = sucursal;
            sucursalSelect.appendChild(option);
        });
    
        departamentos.forEach(departamento => {
            const option = document.createElement('option');
            option.value = departamento;
            option.textContent = departamento;
            departamentoSelect.appendChild(option);
        });
    
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaSelect.appendChild(option);
        });
    
        subcategorias.forEach(subcategoria => {
            const option = document.createElement('option');
            option.value = subcategoria;
            option.textContent = subcategoria;
            subcategoriaSelect.appendChild(option);
        });
    }  
});
