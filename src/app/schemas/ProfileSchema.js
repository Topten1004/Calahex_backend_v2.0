import { Schema , model }  from 'mongoose' ;
import mongoose from 'mongoose' ;

const ProfileSchema = new Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    first_name : {
        type : String,
        required : true 
    },
    last_name : {
        type : String,
        required : true
    },
    country : {
        type : String,
        required : true
    },
    city : {
        type : String,
        required : true
    },
    street : {
        type : String,
        required : true
    },
    postal_code : {
        type :String ,
        required : true
    },
    birthday : {
        type : Date ,
        required : true
    },
    language : {
        type : String,
        required : true
    },
    nick_name : {
        type : String,
        default : null
    },
    is_enable_fa : {
        type : Boolean ,
        default : false
    },
    mother_name : {
        type : String,
        default : null
    },
    father_name : {
        type : String,
        default : null
    },
    hobby : {
        type : String,
        default : null
    },
    best_friend : {
        type : String,
        default : null
    },
    confirm2FA_last : {
        type : Date,
        default : null
    },
    confirm2FA_count : {
        type : Number,
        default : 0
    }
} , { timestamps: true }) ;

export default model('Profile' , ProfileSchema) ;