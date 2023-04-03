import { Schema , model } from "mongoose";
import mongoose from 'mongoose' ;

const OrderSchema = new Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    crypto_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Crypto'
    },
    crypto_amount : {
        type : Number,
        default : 0
    },
    pair_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Crypto'
    },
    pair_amount : {
        type : Number,
        default : 0 ,
    },
    type : {
        type : String,
        enum : ['buy', 'sell', 'convert'],
        default : 'buy'
    },
    price : {
        type : Number,
        default : 0
    },
    fee : {
        type : Number,
        default : 0
    },
    pay_type : {
        type : String,
        enum : ['limit', 'market', 'normal'],
        default : 'limit'
    },
    filled : {
        type : Number,
        default : 0
    },
    status : {
        type : Number,
        default : null
    },
    cleared : {
        type : Number,
        default : 0
    }
} , { timestamps: true }) ;

export default model('Order' , OrderSchema) ;