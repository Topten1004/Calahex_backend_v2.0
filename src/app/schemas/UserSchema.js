import { Schema , model } from "mongoose";
import mongoose from 'mongoose' ;

const UserSchema = new Schema({
    profile_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Profile',
        default : null
    },
    email : {
        type : String,
        unique : true ,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    refferal_code : {
        type : String,
        required : true
    },
    email_verify_code : {
        type : String,
        default : null
    },
    is_verified_email : {
        type : Boolean,
        default : false
    },
    is_verified_phone : {
        type : Boolean,
        default : false
    },
    role : {
        type : String,
        enum : ['admin', 'user'],
        default : 'user'
    },
    allowed : {
        type : Boolean ,
        default : false
    },
} , { timestamps: true }) ;

export default model('User' , UserSchema) ;