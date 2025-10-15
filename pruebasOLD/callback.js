
// CREO QUE NO PODEMOS USAR NODE
const express = require('express');
const path = require('path');
const app = express();
const port = 8000; // Servidor de node puerto???


// Middleware para que Express pueda parsear el JSON de las peticiones POST
app.use(express.json());

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(__dirname));

// Ruta principal que sirve el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- El "Buzón" para el Guardado, escrito en JavaScript ---
app.post('/save-callback', (req, res) => {
    console.log("\n-----------------------------------------");
    console.log(">>> ¡CALLBACK DE GUARDADO RECIBIDO (Node.js)! <<<");

    try {
        // El cuerpo de la petición ya está parseado a JSON gracias al middleware
        const data = req.body;
        
        if (data && data.status === 2) {
            console.log("   -> Estado: Documento listo para guardar.");
            console.log(`   -> El archivo actualizado se puede descargar desde: ${data.url}`);
            // Tu código Node.js haría aquí una petición GET a esa URL para obtener el archivo.
        } else {
            console.log(`   -> Estado de OnlyOffice: ${data.status}`);
        }

    } catch (e) {
        console.error(`   -> Error al procesar el JSON del callback: ${e}`);
    }

    // Respondemos a OnlyOffice que hemos recibido la notificación correctamente.
    res.json({ "error": 0 });
});

// Iniciamos el servidor para que escuche en el puerto 8000
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor Node.js iniciado en http://localhost:${port}`);
});
