import express from 'express';
import passport from 'passport' ;

// controllers
import NotificationController from '../../app/controllers/admin/NotificationController';

// validators
import AddNotificationValidator from '../../app/validators/admin/notification/AddNotificationValidator';
import DeleteNotificationValidator from '../../app/validators/admin/notification/DeleteNotificationValidator';

const router = express.Router() ;

router.post('/*' , passport.authenticate('jwt', { session: false }));

router.post('/notificationList', NotificationController.notificationList) ;
router.post('/addNotification', [AddNotificationValidator], NotificationController.addNotification) ;
router.post('/deleteNotification', [DeleteNotificationValidator], NotificationController.deleteNotification ) ;

export default router ;