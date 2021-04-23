import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';

const app = express();

var corsOptions = {
  origin: 'https://www.jmreardon.com',
}

//app.use(function (req, res, next) { setTimeout(next, 1000) });
app.use('/api/weather/', cors(corsOptions), proxy('https://dd.weather.gc.ca/'));
app.listen(process.env.PORT || 8080);