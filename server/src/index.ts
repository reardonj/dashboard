import express from 'express';
import proxy from 'express-http-proxy';

const app = express();

app.use('/api/weather/', proxy('https://dd.weather.gc.ca/'));
app.listen(process.env.PORT || 8080);