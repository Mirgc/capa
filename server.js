const express = require('express');
const xmlbuilder = require('xmlbuilder');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const routes = [
  '/',
  '/horarios-medicina',
  '/schedule',
];

// Sirve los archivos estáticos de la aplicación Angular
app.use(express.static(path.join(__dirname, './dist/umedcal/browser')));

app.get('/sitemap.xml', (req, res) => {
  const root = xmlbuilder.create('urlset', { version: '1.0', encoding: 'UTF-8' });
  root.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

  routes.forEach(route => {
    const url = root.ele('url');
    url.ele('loc', `https://www.capaupv.com${route}`);
    // You can add more elements like <changefreq> and <priority> here if needed
  });

  res.header('Content-Type', 'application/xml');
  res.send(root.end({ pretty: true }));
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, './robots.txt'));
});

app.use('/WebUntis', async (req, res) => {
  try {
    const response = await axios({
      url: 'https://ehu.webuntis.com/WebUntis/api/rest/view/v1/timetable/entries',
      method: req.method,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
        'anonymous-school': 'ehu',
        'cookie': 'JSESSIONID=1121F3CE369EC7FD2CD90C7E862AC964; schoolname=\"_ZWh1\"; Tenant-Id=\"6184100\"; traceId=2ff471e1f9ff9ded74ac787ca3bd644a4bb6135b;',
        'referer': 'https://ehu.webuntis.com/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-webuntis-api-school-year-id': '34'
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

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/umedcal/browser/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));