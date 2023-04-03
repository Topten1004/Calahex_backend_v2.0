import passport from 'passport' ;
import express from 'express' ;

// _____ controller __________
import ExchangeController from '../../app/controllers/user/ExchangeController';

// ________ validator _____________

import ExchangeByMarketValidator from '../../app/validators/user/crypto/ExchangeByMarketValidator';
import ExchangeByLimitValidator from '../../app/validators/user/crypto/ExchangeByLimitValidator' ;
import ExchangeByNormalValidator from '../../app/validators/user/crypto/ExchangeByNormalValidator' ;

import UserOrderListValidator from '../../app/validators/user/crypto/UserOrderListValidator' ;

import CryptoBalanceValidator from '../../app/validators/user/crypto/CryptoBalanceValidator' ;

import UserOrderCancelValidator from '../../app/validators/user/crypto/UserOrderCancelValidator' ;
import UserOrderClearValidator from '../../app/validators/user/crypto/UserOrderClearValidator' ;
 
const router = express.Router() ;

router.post('/*' , passport.authenticate('jwt', { session: false }));

router.post('/exchangeByMarket', [ExchangeByMarketValidator], ExchangeController.exchangeByMarket) ;
router.post('/exchangeByLimit', [ExchangeByLimitValidator], ExchangeController.exchangeByLimit) ;
router.post('/exchangeByNormal', [ExchangeByNormalValidator], ExchangeController.exchangeByNormal) ;

router.post('/userOrderList' , [UserOrderListValidator], ExchangeController.userOrderList) ;
router.post('/userOrderClear' , [UserOrderClearValidator] , ExchangeController.userOrderClear) ;
router.post('/userOrderCancel' , [UserOrderCancelValidator] , ExchangeController.userOrderCancel) ;

router.post('/cryptoBalance', [CryptoBalanceValidator], ExchangeController.cryptoBalance) ;

export default router ;
