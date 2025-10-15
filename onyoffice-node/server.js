const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = 8000;

const ONLYOFFICE_JWT_SECRET = "mi-secreto-super-seguro-para-onlyoffice";
const DOCUMENTS_DIR = path.join(__dirname, 'documents');

// --- CONTROLADOR, para poder usar los ejs
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---CONTROLADOR - RUTAS

// SOLO MUESTRA LOS DOCUMENTOS DENTRO DE LA CARPETA - No en matrix
app.get('/', (req, res) => {
    console.log(DOCUMENTS_DIR);
    fs.readdir(DOCUMENTS_DIR, (err, files) => {
        if (err) return res.status(500).send("Error leyendo la carpeta de documentos.");

        res.render('index', { files: files.filter(f => f.endsWith('.docx')) });
    });
});

// RUTA DE EDICION -> Prepara y muestra la vista del editor
app.get('/edit', (req, res) => {
    const filename = req.query.filename;
    if (!filename) return res.status(400).send("Falta el nombre del archivo.");

    const fileUrl = `http://host.docker.internal:${port}/files/${filename}`;
    const callbackUrl = `http://host.docker.internal:${port}/save-callback?filename=${filename}`;
    const fileKey = filename; 

    let config = {
        document: {
            fileType: "docx",
            key: fileKey,
            title: filename,
            url: fileUrl,
        },
        documentType: "word",
        editorConfig: {
            mode: "edit",
            lang: "es",
            callbackUrl: callbackUrl,
            user: { id: `user-${Math.floor(Math.random() * 100)}`, name: "Usuario" },
        },
    };

    const token = jwt.sign(config, ONLYOFFICE_JWT_SECRET);
    config.token = token;

    res.render('editor', { title: filename, configJSON: JSON.stringify(config) });
});

// SIRVE LOS DOCUMENTOS - No en matrix
app.get('/files/:filename', (req, res) => {
    const filePath = path.join(DOCUMENTS_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("Archivo no encontrado.");
    res.sendFile(filePath);
});

// CALLBACK_HANDLER
app.post('/save-callback', async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const body = jwt.verify(token, ONLYOFFICE_JWT_SECRET);

        if (body.status === 2 || body.status == 3 || body.status === 6) {
            const filename = req.query.filename;
            const downloadUrl = body.url;
            
            const response = await axios({
                method: 'get', 
                url: downloadUrl, 
                responseType: 'stream' });

            const savePath = path.join(DOCUMENTS_DIR, filename);
            const writer = fs.createWriteStream(savePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`[OK] Archivo "${filename}" guardado correctamente.`);
        }
    } catch (error) {
        console.error("[ERROR] Fallo en el callback de guardado:", error.message);
        return res.status(500).json({ "error": 1 });
    }
    res.json({ "error": 0 });
});

// --- INICIO DEL SERVIDOR ---
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor iniciado. Abre http://localhost:${port} en tu navegador.`);
});
