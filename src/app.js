import 'dotenv/config';
import 'express-async-errors';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser' ;
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit }  from 'express-rate-limit';
import express from 'express';
import cors from 'cors';
import Youch from 'youch';

import passport from 'passport' ;
import passportStrategy from './app/middlewares/PassportStrategy';

import './database' ;

import userRoutes from './routes/user' ;
import adminRoutes from './routes/admin' ;

import AppError from './app/utils/AppError'; // make custom error
import GlobalErrorHandler from './app/controllers/ErrorController' ;

passportStrategy(passport);

const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 1000,
  message: 'Too Many Request from this IP, please try again in an hour'
});

class App {
  constructor() {
    this.server = express() ;
    this.middlewares() ;
    this.routes() ;
    this.exceptionHandler() ;
  }

  middlewares() {
    this.server.disable('x-powered-by');
    this.server.use(cors());
    this.server.use(cookieParser());
    this.server.use(bodyParser.urlencoded({extended: false}));
    this.server.use(bodyParser.json());
    this.server.use(passport.initialize()) ;
    this.server.use(express.json({
      limit: '15kb'
    }));
    this.server.use(helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy : false,
    })) ;
    this.server.use(xss());
    this.server.use(hpp()) ;
    this.server.use(mongoSanitize());
    this.server.use('/v1/ex/api', limiter) ;
    this.server.use('/v1/ex/admin/api', limiter) ;
  }

  routes() {
    this.server.use('/v1/ex/api', userRoutes) ;
    this.server.use('/v1/ex/admin/api', adminRoutes) ;
    this.server.use('/v1/ex/files', express.static('./src/uploads'));
    
    this.server.use('*' , (req, res, next) => { 
      //if errors appear in undefined route
      const err =  new AppError(404 , 'fail' , 'Undefined route.') ;
      next(err , req, res, next) ;
    }) ;

    // handle all errors from  undefined routes and '/v1/hex/api/'
    this.server.use(GlobalErrorHandler) ;
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, _next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON();
        return res.status(500).json(errors);
      }

      return res.status(500).json({ error: 'Internal server error' });
    });
  }
}

export default new App().server;