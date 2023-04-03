import ControllerUtils from '../../utils/ControllerUtils' ;

import {
    Users,
    Wallets,
    Profiles,
} from '../../schemas' ;

import AppError from '../../utils/AppError';
import SendMail from '../../utils/SendMail';
import { formatDBDate } from '../../utils/Helper';

import passportConfig from '../../../configs/passportConfig' ;

import bcrypt from 'bcrypt' ;
import jwt from 'jsonwebtoken' ;

class AuthController extends ControllerUtils {
  
    constructor() {
        super() ;

        this.tokenForUser = this.tokenForUser.bind(this) ;
        this.createPassword =  this.createPassword.bind(this) ;
        this.comparePassword = this.comparePassword.bind(this) ;
        this.confirmUser = this.confirmUser.bind(this) ;
        this.signUp = this.signUp.bind(this) ;
        this.signIn = this.signIn.bind(this) ;
        this.profile = this.profile.bind(this) ;
        this.profileEdit = this.profileEdit.bind(this) ;
        this.profileInfo = this.profileInfo.bind(this) ;
        this.confirm2FAProfile = this.confirm2FAProfile.bind(this) ;
        this.check2FAProfile = this.check2FAProfile.bind(this) ;

        this.isAuthenticated = this.isAuthenticated.bind(this) ;
    }

    async createPassword(password , callback) {
        bcrypt.genSalt(10 , function(err, salt) {
            if(err) return next(new AppError(400 , "fail" , "Generate Salt Failed.")) ;

            bcrypt.hash(password, salt, function(err, hash) {
                if(err) return next(new AppError(400 , "fail" , "Password Hash Failed.")) ;
                else return callback(hash) ;
            });
        })
    }

    async comparePassword(password , db_password , next , callback) {
        bcrypt.compare(password , db_password ,function(err , isMatch) {
            if(err) return next(new AppError(40 , "compare" , "Compare Password Failed."))
            else return callback(isMatch) 
        })
    }

    async tokenForUser(userInfo, next, callback) {
        jwt.sign({
            user : userInfo
        } , 
        passportConfig.JWT_SECRET_OR_KEY , 
        {
            expiresIn : passportConfig.JWT_TOKEN_EXPIRATION
        } , function (err , token) {
            if(err) return next(new AppError(403 , "token" , "Provide Token Failed."))
            else return callback(token)
        }) ;
    }

    async signUp( req, res , next) {

        await this.createPassword(req.body.password , async (hash) => {
            let user = await Users.findOne({
                email :  req.body.email
            }) ;

            if(user) return next(new AppError(403, "fail", "User Already Exist.")) ;

            user = await Users.store({
                ...req.body,
                password : hash,
            })

            if(!user) return next(new AppError(403 , "fail" , "User Create Failed.") ) ;
            else {
                res.status(200).json({
                    status : "success",
                    message : "User Created Successfully.",
                })
                // await SendMail(req.body.email, async (code) => {
                    
                //     // in build project
                    
                //     if(!code) {
                //         // await Users.delete({
                //         //     _id : user._id
                //         // }) ;
                //         return ;
                //     }

                // user = await Users.findOne({
                //     email : req.body.email
                // }) ;

                // user.email_verify_code = code ;
                // await user.save() ;
                // })
            }
        }) ;
    }

    async signIn(req, res, next) {
        let user = await Users.findOne({email : req.body.email}) ;

        if(!user) return next(new AppError(403 , "unknown" , "Unknown User") ) ;

        await this.comparePassword(req.body.password , user.password , next , async (isMatch) => {
            if(isMatch) {
                if(!user.is_verified_email) return next(new AppError(403 , "verify" , "Email isn't verified") ) ;

                user = await Users.hasOne({
                    email : req.body.email, 
                } , 'profile_id' ) ;

                if(!user.profile_id) return next(new AppError(403, "verify", "Profile does not exist")) ;
                
                await this.tokenForUser(user , next , async (token) => {
                    return res.status(200).json({
                        status : "success" ,
                        message : "Login Successfully.",
                        access_token : token ,
                        profile : {
                            ...user.toJSON().profile_id ,
                            birthday : formatDBDate(user.profile_id.birthday, "date")
                        }
                    })
                })
            } else {
                return res.status(403).json({
                    status : "match" ,
                    message : "Password isn't matched."
                })
            }
        }) ;
    }
    
    async confirmUser (req, res, next) {
        const user = await Users.findOne({
            email : req.body.email, 
            email_verify_code : req.body.email_verify_code
        }) ;

        if(!user) return next(new AppError(403 , "fail" , "Confirm User Failed.") ) ;
        
        user.is_verified_email = true ;
        await user.save() ;

        return res.status(200).json({
            status : "success" ,
            message : "Confirm Successfully.",
        })
    }

    async profile( req, res, next) {

        let user = await Users.findOne({
            email : req.body.email
        }) ;

        if(!user) return next(new AppError(403, 'profile', 'User does not exist')) ;

        const profile = await Profiles.store({
            ...req.body ,
            user_id : user._id
        }) ;

        if(!profile) return next(new AppError(403 , "profile" , "Profile created fail")) ;

        user.profile_id = profile._id ;
        await user.save() ;

        let wallet = await Wallets.store({
            user_id : user._id,
        }) ;

        if(!wallet) return next(new AppError(403, 'profile', 'Wallet created fail')) ;

        await this.tokenForUser(user , next , async (token) => {
            return res.status(200).json({
                status : "success" ,
                message : "Login Successfully.",
                access_token : token ,
                profile : {
                    ...profile,
                    birthday : formatDBDate(user.profile_id.birthday, "date")
                }
            })
        })
    }

    async profileEdit( req, res, next) {
        
        let profile = await Profiles.findOne({
            _id : req.body._id
        })

        if(!profile) return next(new AppError(403, "profile" , "Profile Does Not Exist")) ;
        
        profile = await Profiles.findOneAndUpdate({_id : req.body._id} , {
            "$set" : {
                ...req.body
        }}) ;

        if(!profile) return next(new AppError(400 , "fail" , "Profile Changed Failed.") ) 

        if(!req.body.is_enable_fa){
            profile.nick_name = null ;
            profile.father_name = null ;
            profile.mother_name = null ;
            profile.hobby = null ;
            profile.best_friend = null ;

            await profile.save() ;
        }
        
        return res.status(200).json({
            status : "success",
            message : "Profile Changed Successfully.",
            profile :  {
                ...profile.toJSON() ,
                birthday : formatDBDate(profile.birthday, "date")
            }
        })
    }

    async profileInfo(req, res, next) {
        let profile = await Profiles.findOne({
            _id : req.user.profile_id
        }) ;

        if(!profile) return next(new AppError(403, 'fail', "Profile Does Not Exist.")) ;

        return res.status(200).json({
            profile : {
                ...profile.toJSON(),
                birthday : formatDBDate(profile.birthday, "date") 
            }
        })
    }

    async confirm2FAProfile(req, res, next) {
        
        // You can execute confirming 2FA inside server .
        // If you check 2FA in frontend after you send profile information to client, it means profile information is opened.
        // Even if user sign in your website, your 2FA profile information must not be opened in client side.(except Edit Profile)

        let originProfile = await Profiles.findOne({
            user_id : req.user._id
        }) ;

        if(!originProfile) return next(new AppError(403, 'confirm2FAProfile', 'Profile Does Not Exist.')) ;

        if( originProfile.confirm2FA_last !== null && 
            Number( Number( new Date().getTime() - new Date(originProfile.confirm2FA_last).getTime() ) / 1000 / 60 ) > 2
        ){
            originProfile.confirm2FA_last = null;
            originProfile.confirm2FA_count = 0 ;
            await originProfile.save() ;
        }

        if(originProfile.confirm2FA_count === 3 && originProfile.confirm2FA_last !== null) {
            return res.status(201).json({
                message : 'Check 2FA Authentication Failed',
                status : 'You can check 2FA after ' + Number( 2 - Number( new Date().getTime() - new Date(originProfile.confirm2FA_last).getTime() ) / 1000 / 60 ).toFixed(2) + " minutes.",
                code : 201
            }) ;
        }

        let profile =  await Profiles.findOne({
            ...req.body,
            user_id : req.user._id,
        }) ;

        if(!profile) {
            if(originProfile.confirm2FA_count < 3) {
                
                originProfile.confirm2FA_count += 1 ;
                await originProfile.save() ;

                if(originProfile.confirm2FA_count === 3) {
                    originProfile.confirm2FA_last = new Date() ;
                    await originProfile.save() ;

                    setTimeout(async () => {
                        originProfile.confirm2FA_count = 0;
                        originProfile.confirm2FA_last = null ;
                        await originProfile.save() ;
                    }, 120000) ;
                }

                return res.status(201).json({
                    message : 'Check 2FA Authentication Failed.',
                    status : originProfile.confirm2FA_count === 3 ? 'You can try after 2 minutes.' :
                                                                    'You can try ' + Number( 3 - originProfile.confirm2FA_count ) + ' times futher more.',
                    code : 201
                }) ;
            }  
        }

        originProfile.confirm2FA_count = 0 ;
        originProfile.confirm2FA_last = null ;
        await originProfile.save() ;

        return res.status(200).json({
            message : 'Check 2FA Authentication Successed',
            status : 'Success',
            code : 200
        }) ;
    }

    async check2FAProfile(req, res, next) {
        let profile = await Profiles.findOne({
            user_id : req.user._id
        }) ;

        if(!profile) return next(new AppError(403, 'check2FAProfile', 'Profile Does Not Exist.')) ;

        if(!profile.is_enable_fa) return res.status(200).json({
            check2FA : false
        }) ;
        
        return res.status(200).json({
            check2FA : true
        }) ;
    }

    async isAuthenticated(req, res, next) {
        return res.status(200).json({
            status : 'success'
        }) ;
    }
}
  
export default new AuthController();