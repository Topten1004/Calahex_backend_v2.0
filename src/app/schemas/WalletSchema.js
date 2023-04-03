import { Schema , model } from "mongoose";
import mongoose from 'mongoose' ;

const WalletSchema = new Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    futures_activated_at : {
        type : Date,
        default : null
    },
    margin_activated_at : {
        type : Date,
        default : null
    },
    pool_activated_at : {
        type : Date,
        default : null
    },
    savings_activated_at : {
        type : Date,
        default : null
    },
    margin_paid_at : {
        type : Date,
        default : null
    },
    pool_paid_at : {
        type : Date,
        default : null
    },
    status : {
        type : String ,
        default : "good"
    },
} , { timestamps: true }) ;

export default model('Wallet' , WalletSchema) ;