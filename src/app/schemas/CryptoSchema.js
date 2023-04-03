import { Schema , model } from "mongoose";

const CryptoSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    symbol : {
        type : String,
        required : true
    },
    decimal : {
        type : Number,
        required : true
    },
    address : {
        type : String,
        default : null
    },
    logo : {
        type : String,
        default : null
    },
    pair : {
        type : Array,
        default : null
    },
    whitepaper : {
        type : String,
        default : null
    },
    for_cefi : {
        type : Boolean,
        default : true
    },
    initial_price : {
        type : Object,
        default : null
    },
    deposit_fee : {
        type : Number,
        default : 0
    },
    transfer_fee : {
        type : Number,
        default : 0
    },
    withdraw_fee : {
        type : Number,
        default : 0
    },
    transaction_fee : {
        type : Number,
        default : 0
    },
    is_deposit_coin : {
        type : Boolean,
        default : false
    },
    is_withdraw_coin : {
        type : Boolean,
        default : false
    },
    is_base_coin : {
        type : Boolean,
        default : false
    },
    is_deleted : {
        type : Boolean,
        default : false
    },
    status : {
        type : String,
        default : null
    }
} , { timestamps: true }) ;

export default model('Crypto' , CryptoSchema) ;