import { Schema , model }  from 'mongoose' ;
import mongoose from 'mongoose' ;

const PayorderSchema = new Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    crypto_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Crypto'
    },
    payment_id : {
        type : String,
        default : null
    },
    reference : {
        type : String,
        enum : ['crypto', 'fiat'],
        default : 'crypto'
    },
    unit : {
        type : String,
        default : null
    },
    amount : {
        type : Number,
        default : 0
    },
    address : {
        type : String,
        default : null
    },
    amount_left : {
        type :  Number ,
        default : 0
    },
    payment_type : {
        type : String ,
        enum : ['deposit', 'withdraw'],
        default : 'deposit'
    },
    status : {
        type : String,
        default : 'requesting'
    },
    cleared : {
        type : Boolean,
        default : false
    }
} , { timestamps: true }) ;

export default model('Payorder' , PayorderSchema) ;