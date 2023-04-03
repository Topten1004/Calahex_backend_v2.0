import ControllerUtils from '../../utils/ControllerUtils' ;

import {
    Notifications
} from '../../schemas' ;

import AppError from '../../utils/AppError';

class UserController extends ControllerUtils {
  
    constructor() {
        super() ;

        // if you are not defined this, you will use signUp function but you can't use async and await.
        this.notificationList = this.notificationList.bind(this) ;
        this.addNotification = this.addNotification.bind(this) ;
        this.deleteNotification = this.deleteNotification.bind(this) ;
    }

    async notificationList(req, res, next) {
        const notifications = await Notifications.find({}) ;

        if(!notifications) return next(new AppError(403, "notificationList", "Get Notification List Failed.")) ;

        res.status(200).json({
            notificationList : notifications
        })
    }

    async addNotification(req, res, next) {
        const notification = await Notifications.store( req.body ) ;

        if(!notification) return next(new AppError(403 , "fail" , "Notification Created Failed.") ) ;

        const notifications = await Notifications.find({}) ;

        global.io.emit("Response: Notifications",  notifications );

        return res.status(200).json({
            status : "success",
            message : "Notification Created Successfully.",
            notification : notification
        })
    }

    async deleteNotification(req, res, next) {
        const result = await Notifications.delete( req.body ) ;

        if(!result) return next(new AppError(403 , "fail" , "Delete Notification Failed.") ) ;

        const notifications = await Notifications.find({}) ;

        global.io.emit("Response: Notifications",  notifications );

        return res.status(200).json({
            status : 'success'
        })
    }
}
  
export default new UserController();