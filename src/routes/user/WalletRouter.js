import passport from 'passport' ;
import express from 'express' ;

// __________ controllers ______________
import PaymentController from '../../app/controllers/user/PaymentController';
import ExchangeController from '../../app/controllers/user/Wallet/ExchangeController';
import AccountController from '../../app/controllers/user/Wallet/AccountController';

// __________ validators _______________
import FiatDepositValidator from '../../app/validators/user/wallet/FiatDepositValidator';
import GetLimitAmountValidator from '../../app/validators/user/wallet/GetLimitAmountValidator';
import CreatePaymentValidator from '../../app/validators/user/wallet/CreatePaymentValidator' ;
import ClearExchangePayHistoryValidator from '../../app/validators/user/wallet/ClearExchangePayHistoryValidator' ;
import CloseDepositHistoryValidator from '../../app/validators/user/wallet/CloseDepositHistoryValidator' ;
import ExchangeCryptoWithdrawValidator from '../../app/validators/user/wallet/ExchangeCryptoWithdrawValidator' ;
import TransferCryptoValidator from '../../app/validators/user/wallet/TransferCryptoValidator' ;
import ConvertCryptoValidator from '../../app/validators/user/wallet/ConvertCryptoValidator' ;

const router = express.Router() ;

router.post('/*' , passport.authenticate('jwt', { session: false }));

router.post('/walletAccountInfo', AccountController.walletAccountInfo) ;
router.post('/wholeCryptoBalance', AccountController.wholeCryptoBalance) ;
router.post('/exchangeWalletAccountInfo', ExchangeController.walletAccountInfo) ;
router.post('/exchangeDepositAccountInfo', ExchangeController.depositAccountInfo) ;
router.post('/exchangeWithdrawAccountInfo', ExchangeController.withdrawAccountInfo) ;

router.post('/convertCrypto' , [ConvertCryptoValidator], ExchangeController.convertCrypto) ;
router.post('/transferCrypto', [TransferCryptoValidator], AccountController.transferCrypto) ;
router.post('/clearExchangePayHistory', [ClearExchangePayHistoryValidator], ExchangeController.clearPayHistory) ;
router.post('/closeExchangeDepositHistory', [CloseDepositHistoryValidator], ExchangeController.closeDepositHistory) ;

router.post('/exchangeDepositHistory' , ExchangeController.depositHistory) ;
router.post('/exchangeWithdrawHistory', ExchangeController.withdrawHistory);

router.post('/fiatDeposit' , [FiatDepositValidator] , PaymentController.fiatDeposit) ;
router.post('/exchangeCryptoWithdraw', [ExchangeCryptoWithdrawValidator], PaymentController.cryptoWithdraw) ;

router.post('/createPayment', [CreatePaymentValidator], PaymentController.createPayment) ;
router.post('/getLimitAmount', [GetLimitAmountValidator], PaymentController.getLimitAmount) ;



export default router ;