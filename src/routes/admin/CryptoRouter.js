import express from 'express';
import passport from 'passport' ;
import Upload from '../../app/middlewares/Upload';

// controllers
import CryptoController from '../../app/controllers/admin/CryptoController';

// validators
import AddCryptoValidator from '../../app/validators/admin/crypto/AddCryptoValidator' ;
import DeleteCryptoValidator from '../../app/validators/admin/crypto/DeleteCryptoValidator';
import UpdateCryptoValidator from '../../app/validators/admin/crypto/UpdateCryptoValidator';

const router = express.Router() ;

router.post('/*' , passport.authenticate('jwt', { session: false }));

router.post('/cryptoList' , CryptoController.cryptoList) ;
router.post('/baseCryptoList', CryptoController.baseCryptoList);
router.post('/addcrypto', Upload, [AddCryptoValidator] , CryptoController.addCrypto) ;
router.post('/updatecrypto', Upload, [UpdateCryptoValidator], CryptoController.updateCrypto) ;
router.post('/deletecrypto', [DeleteCryptoValidator], CryptoController.deleteCrypto) ;

export default router ;