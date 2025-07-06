console.log("starting server");
var createError = require('http-errors');
var express = require('express');
const morgan = require('morgan');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

require('dotenv').config({ path: path.resolve(__dirname, 'config.env') });

const mongoose = require('mongoose');
const eventRouter = require('./routes/eventRoutes')

const JWT_SECRET = process.env.JWT_SECRET;

console.log('JWT_SECRET: ', JWT_SECRET);


console.log(`node environment: ${process.env.NODE_ENV}`);

console.log(`PID: ${process.pid}`);

let DB = null;

if (process.env.NODE_ENV === 'development') {
  DB = process.env.WTDB_NO_AUTH;  // e.g. "mongodb://127.0.0.1:27017/vctrDB"
} else {
  DB = process.env.WTDB.replace('<PASSWORD>', process.env.WTDB_PASSWORD);
}


console.log('DB connection string:', DB);

mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('DB connection successful'))
  .catch(err => console.error('DB connection error:', err));

// fetch configuration from mongo
let HTTP_PORT = 80;

async function main() {

  try {
    await startHttpServer();
  }
   catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }

  // Start the rest of the server logic here

    console.log(`HTTP server started, waiting for messages on port: ${HTTP_PORT}`);

    process.on('uncaughtException', err => {
      console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.log(err.name, err.message);
      process.exit(1);
    });

    // server startup
    async function startHttpServer(){

        var app = express();
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'jade');
        app.use(logger('dev'));
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use(cookieParser());
        app.use(express.static(path.join(__dirname, 'public')));
        app.listen(HTTP_PORT, () => {
            console.log(`Server is listening on port ${HTTP_PORT}`);
        });

        // 1 middleware
        console.log(process.env.NODE_ENV);
        if (process.env.NODE_ENV === 'development') {
            app.use(morgan('dev'));
        }

        // 2 mount routers
        app.use('/events', eventRouter);


        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            next(createError(404));
        });

        // error handler
        app.use(function(err, req, res, next) {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });

        module.exports = app;

    }

}

main();


