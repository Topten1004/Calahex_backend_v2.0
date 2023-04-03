import express from 'express';
import passport from 'passport' ;

// controllers
import AuthController from '../../app/controllers/user/AuthController';

// validators
import SignUpValidator from '../../app/validators/user/auth/SignUpValidator';
import SignInValidator from '../../app/validators/user/auth/SignInValidator';
import ConfirmValidator from '../../app/validators/user/auth/ConfirmValidator';
import ProfileValidator from '../../app/validators/user/auth/ProfileValidator.js' ;
import ProfileEditValidator from '../../app/validators/user/auth/ProfileEditValidator.js' ;
import Confirm2FAProfileValidator from '../../app/validators/user/auth/Confirm2FAProfileValidator';

const router = express.Router() ;

router.post('/signup' , [SignUpValidator] , AuthController.signUp) ;
router.post('/signin' , [SignInValidator] , AuthController.signIn) ;
router.post('/confirm', [ConfirmValidator], AuthController.confirmUser) ;
router.post('/profile', [ProfileValidator], AuthController.profile) ;

router.post('/*' , passport.authenticate('jwt', { session: false }));

router.post('/isAuthenticated', AuthController.isAuthenticated) ;
router.post('/profileInfo', AuthController.profileInfo) ;
router.post('/editprofile' , [ProfileEditValidator] , AuthController.profileEdit) ; 

router.post('/confirm2FAProfile', [Confirm2FAProfileValidator], AuthController.confirm2FAProfile) ;
router.post('/check2FAProfile', AuthController.check2FAProfile) ;

export default router;