const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Sirve los archivos estáticos de la aplicación Angular
app.use(express.static(path.join(__dirname, './dist/umedcal/browser')));

app.use('/WebUntis', async (req, res) => {
  try {
    const response = await axios({
      url: 'https://hektor.webuntis.com/WebUntis/api/public/timetable/weekly/data',
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'cache-control' : 'no-cache',
        'cookie' : 'schoolname="_ZWh1"; traceId=6c482b45a3cb9778e04532756b5e3e797341d2d1; JSESSIONID=BF6D6C001F3D825241FB0BFEB1C6BE57',
        'Referer': 'https://hektor.webuntis.com/WebUntis/',
        'Pragma': 'no-cache',
      },
      data: req.body, // Si hay datos en la solicitud (para POST, PUT, etc.)
      params: req.query // Si hay parámetros en la URL
    });
    
    res.status(response.status).json(response.data); // Enviar la respuesta al cliente
  } catch (error) {
    res.status(error.response ? error.response.status : 500).json({
      message: 'Error en la solicitud al servidor de destino',
      error: error.message,
    });
  }
});

app.listen(3000, () => console.log('Proxy running on port 3000'));
