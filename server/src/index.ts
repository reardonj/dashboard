import express from 'express';
import proxy from 'express-http-proxy';

const app = express();

//app.use(function (req, res, next) { setTimeout(next, 1000) });
app.use('/api/weather/', proxy('https://dd.weather.gc.ca/'));
app.listen(process.env.PORT || 8080);