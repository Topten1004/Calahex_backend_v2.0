import express from 'express';
import passport from 'passport' ;

// controllers
import UserController from '../../app/controllers/admin/UserController';

// validators
import UpdateUserProfileValidator from '../../app/validators/admin/user/UpdateUserProfileValidator' ;
import CreateUserProfileValidator from '../../app/validators/admin/user/CreateUserProfileValidator' ;

const router = express.Router() ;

router.post('/*' , passport.authenticate('jwt', { session: false }));

router.post('/userList' , UserController.userList) ;
router.post('/deleteUser', UserController.deleteUser) ;
router.post('/updateUserProfile',[UpdateUserProfileValidator], UserController.updateUserProfile) ;
router.post('/createUserProfile' , [CreateUserProfileValidator], UserController.createUserProfile) ;

export default router;