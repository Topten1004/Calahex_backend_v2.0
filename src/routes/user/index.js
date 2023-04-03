import { Router } from 'express';
import AuthRouter from './AuthRouter' ;
import CryptoRouter from './CryptoRouter' ;
import WalletRouter from './WalletRouter' ;

const routes = new Router();

routes.use('/auth' , AuthRouter) ;
routes.use('/crypto', CryptoRouter) ;
routes.use('/wallet', WalletRouter) ;
  
export default routes;