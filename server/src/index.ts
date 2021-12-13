import express from 'express';
import cors, { CorsOptions, CorsRequest } from 'cors';
import proxy from 'express-http-proxy';

const app = express();

var corsOptions: CorsOptions = {
  origin: process.env.PORT ? 'https://www.jmreardon.com' : undefined,
}

//app.use(function (req, res, next) { setTimeout(next, 1000) });
app.use('/api/weather/', cors(corsOptions), proxy('https://dd.weather.gc.ca/'));
app.use(express.static('public'))
app.listen(process.env.PORT || 8080);