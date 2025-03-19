const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Obtener la ruta del archivo
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Si la URL termina en /, servir index.html
    if (req.url.endsWith('/')) {
        filePath = path.join(__dirname, 'index.html');
    }
    
    // Si la URL es /lectura.html o contiene parámetros de consulta, servir lectura.html
    if (req.url.startsWith('/lectura.html')) {
        filePath = path.join(__dirname, 'lectura.html');
    }
    
    // Obtener la extensión del archivo
    const extname = path.extname(filePath);
    
    // Establecer el tipo de contenido
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.xmm': 'text/xml; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.ico': 'image/x-icon'
    };
    
    const contentType = contentTypes[extname] || 'text/plain';
    
    // Leer y servir el archivo
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Si el archivo no existe, intentar servir index.html
                fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('Archivo no encontrado');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end('Error del servidor: ' + error.code);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            res.end(content, 'utf-8');
        }
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
