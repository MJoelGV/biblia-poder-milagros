const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(`Petición recibida: ${req.url}`);
    // Endpoint para listar archivos de audio pregrabado
    if (req.url === '/audio/list') {
        const audioDir = path.join(__dirname, 'audio');
        fs.readdir(audioDir, (err, files) => {
            if (err) {
                res.writeHead(500);
                res.end('Error listando audio');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(files));
            }
        });
        return;
    }

    // Obtener ruta sin query y manejar percent-encoding
    const rawUrl = req.url.split('?')[0];
    const decodedUrl = decodeURIComponent(rawUrl);
    const relativePath = decodedUrl === '/' ? 'index.html' : decodedUrl.replace(/^\/+/, '');
    let filePath = path.join(__dirname, relativePath);
    
    // Obtener la extensión del archivo
    const extname = path.extname(filePath);
    
    // Establecer el tipo de contenido
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.mp3': 'audio/mpeg',
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
