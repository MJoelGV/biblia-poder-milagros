# Configuración de API de YouTube para Predicaciones

## Pasos para obtener la API Key de YouTube

1. **Ir a Google Cloud Console**
   - Visita: https://console.cloud.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Crear un nuevo proyecto**
   - Haz clic en el selector de proyectos (arriba a la izquierda)
   - Haz clic en "NUEVO PROYECTO"
   - Nombre: "Biblia Poder y Milagros"
   - Haz clic en "CREAR"

3. **Habilitar YouTube Data API**
   - En el menú de navegación, ve a "API y servicios" > "Biblioteca"
   - Busca "YouTube Data API v3"
   - Haz clic en ella y luego en "HABILITAR"

4. **Crear credenciales**
   - Ve a "API y servicios" > "Pantalla de consentimiento de OAuth"
   - Selecciona "Externo" y haz clic en "CREAR"
   - Completa la información básica:
     - Nombre de la aplicación: "Biblia Poder y Milagros"
     - Correo electrónico de usuario de asistencia: tu correo
   - Haz clic en "GUARDAR Y CONTINUAR" (puedes omitir los demás pasos)

5. **Crear API Key**
   - Ve a "API y servicios" > "Credenciales"
   - Haz clic en "+ CREAR CREDENCIALES" > "Clave de API"
   - Copia la clave generada

6. **Configurar la clave en el código**
   - Abre el archivo `js/youtube-api.js`
   - Reemplaza `TU_API_KEY_AQUI` con tu clave real

## Configuración del Canal

El sistema está configurado para funcionar con el canal:
- **URL**: https://www.youtube.com/@pastorcarlospleitez
- **Handle**: @pastorcarlospleitez

## Características Implementadas

### ✅ Funcionalidades
- Carga automática de todas las playlist del canal
- Reproducción con pantalla apagada (Media Session API)
- Controles en notificación y lock screen
- Búsqueda y filtrado por temas
- Navegación entre predicaciones
- Reproducción continua

### 📱 Media Session API
- Play/Pausa en notificaciones
- Botón anterior/siguiente
- Seek backward/forward (10 segundos)
- Metadata del video actual

### 🎵 YouTube Player
- Reproducción directa de videos de YouTube
- Control de volumen y progreso
- Estado de reproducción en tiempo real
- Manejo automático de siguiente video

## Archivos Modificados

1. **predicaciones.html** - Página principal con reproductor
2. **js/youtube-api.js** - Clase para interactuar con YouTube API
3. **js/youtube-player.js** - Clase para el reproductor de YouTube
4. **index.html** - Añadido enlace al menú

## Pruebas

Para probar sin API Key:
- La aplicación mostrará datos de ejemplo
- Podrás probar la interfaz y controles
- La reproducción real requiere API Key válida

## Solución de Problemas

### Error: "API key not valid"
- Verifica que la API Key sea correcta
- Asegúrate de que YouTube Data API esté habilitada

### Error: "Channel not found"
- Verifica el handle del canal (@pastorcarlospleitez)
- El canal debe ser público

### Error: "Quota exceeded"
- La API de YouTube tiene límites diarios
- Considera implementar caché para reducir llamadas

## Próximas Mejoras

1. **Caché local** para reducir llamadas a la API
2. **Descarga de audio** para escuchar offline
3. **Sincronización** con playlist específicas
4. **Estadísticas** de reproducción
5. **Compartir** predicaciones en redes sociales
