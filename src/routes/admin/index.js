import { Router } from 'express';

import AuthRouter from './AuthRouter' ;
import UserRouter from './UserRouter' ;
import CryptoRouter from './CryptoRouter' ;
import NotificationRouter from './NotificationRouter' ;

const routes = new Router();

routes.use('/auth' , AuthRouter) ;
routes.use('/user' , UserRouter) ;
routes.use('/crypto', CryptoRouter) ;
routes.use('/notification', NotificationRouter) ;
  
export default routes;