const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.wasm': 'application/wasm',
    '.default': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
    console.log(`Solicitud: ${req.method} ${req.url}`);
    
    // Manejar solicitudes raíz
    const parsedUrl = url.parse(req.url);
    let pathname = path.join(ROOT_DIR, parsedUrl.pathname);
    
    // Si es la raíz, servir index.html
    if (parsedUrl.pathname === '/') {
        pathname = path.join(ROOT_DIR, 'index.html');
    }
    
    // Verificar si el archivo existe
    fs.exists(pathname, (exist) => {
        if (!exist) {
            // Si el archivo no existe, intentar con .html
            if (!path.extname(pathname)) {
                pathname += '.html';
            }
            
            // Verificar nuevamente
            fs.exists(pathname, (existHtml) => {
                if (!existHtml) {
                    // Archivo no encontrado
                    res.statusCode = 404;
                    res.end(`Archivo no encontrado: ${req.url}`);
                    return;
                }
                
                // Servir el archivo HTML
                serveFile(pathname, res);
            });
        } else {
            // Servir el archivo solicitado
            serveFile(pathname, res);
        }
    });
});

function serveFile(pathname, res) {
    // Leer el archivo
    fs.readFile(pathname, (err, data) => {
        if (err) {
            res.statusCode = 500;
            res.end(`Error al leer el archivo: ${err}`);
            return;
        }
        
        // Establecer el tipo MIME
        const ext = path.extname(pathname);
        const contentType = MIME_TYPES[ext.toLowerCase()] || MIME_TYPES['.default'];
        
        // Configurar cabeceras
        res.setHeader('Content-Type', contentType);
        
        // Permitir CORS para desarrollo
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Enviar el archivo
        res.end(data);
    });
}

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}/`);
    console.log(`Sirviendo archivos desde: ${ROOT_DIR}`);
});

// Manejar errores del servidor
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Error: El puerto ${PORT} está en uso.`);
    } else {
        console.error('Error del servidor:', error);
    }
});
