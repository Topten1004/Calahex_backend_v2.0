import ControllerUtils from '../../utils/ControllerUtils' ;

import {
    Users,
    Profiles
} from '../../schemas' ;

import AppError from '../../utils/AppError';
import { formatDBDate } from '../../utils/Helper';

class UserController extends ControllerUtils {
  
    constructor() {
        super() ;

        // if you are not defined this, you will use signUp function but you can't use async and await.
        this.userList = this.userList.bind(this) ;
        this.deleteUser = this.deleteUser.bind(this) ;
        this.updateUserProfile = this.updateUserProfile.bind(this) ;
        this.createUserProfile = this.createUserProfile.bind(this) ;
    }

    async userList (req, res, next) {
        const users = await Users.hasAll({} , 'profile_id') ;

        if(!users) return next(new AppError(403, "userlist", "Get User List Failed.")) ;

        let userList = [] ;

        for(let user of users) {
            userList.push({
                _id : user._id,
                email : user.email,
                password : user.password,
                refferal_code : user.refferal_code,
                is_email_verified : user.is_email_verified,
                is_phone_verified : user.is_phone_verified,
                createdAt : formatDBDate(user.createdAt , "datetime"),
                status : user.allowed,
                profile : user.profile_id ? {
                    _id : user.profile_id._id,
                    first_name : user.profile_id.first_name,
                    last_name : user.profile_id.last_name,
                    street : user.profile_id.street,
                    country : user.profile_id.country,
                    language : user.profile_id.language,
                    postal_code : user.profile_id.postal_code,
                    city : user.profile_id.city,
                    birthday : formatDBDate(user.profile_id.birthday, "date")
                } : null
            });
        }
        return res.status(200).json({
            userList : userList
        })

    }

    async deleteUser(req, res, next) {
        let user = await Users.hasOne({
            _id : req.body._id
        })

        if(!user) return next(new AppError(403, "deleteUser", "Delete User Failed.")) ;
        let result = await Users.delete({
            _id : user._id
        })

        if(!result) return next(new AppError(403, "deleteUser", "Delete User Failed.")) ;
        
        result = await Profiles.delete({
            _id : user.profile_id
        })

        if(!result) return next(new AppError(403, "deleteUser", "Delete Profile Related User Failed")) ;

        return res.status(200).json({
            status : 'success'
        })
    }

    async updateUserProfile(req, res, next) {

        let profile = await Profiles.findOne({
            _id : req.body._id
        })

        if(!profile) return next(new AppError(403, "profile" , "Profile Does Not Exist")) ;
        
        profile = await Profiles.findOneAndUpdate({_id : req.body._id} , {
            "$set" : {
                ...req.body
        }}) ;

        if(!profile) return next(new AppError(403 , "fail" , "Profile Changed Failed.") ) 

        return res.status(200).json({
            status : "success",
            message : "Profile Updated Successfully.",
            profile :  {
                ...profile.toJSON() ,
                birthday : formatDBDate(profile.birthday, "date")
            }
        })
    }

    async createUserProfile(req, res, next) {

        const profile = await Profiles.store( req.body ) ;

        if(!profile) return next(new AppError(403 , "fail" , "Profile Created Failed.") ) ;

        const user = await Users.findOne({
            _id : req.body.user_id
        });

        if(!user) return next(new AppError(403, "fail", "User Does Not Exist.")) ;

        user.profile_id = profile._id ;
        await user.save() ;

        return res.status(200).json({
            status : "success",
            message : "Profile Created Successfully.",
            profile : profile,
            is_created_profile : true
        })
    }
}
  
export default new UserController();