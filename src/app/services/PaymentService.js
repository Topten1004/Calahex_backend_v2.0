
import axios from "axios";
import apiConfig from '../static/Constant' ;
import { isset } from "../utils/Helper";

export const NowPayment = async (amount, unit, user_id, order_id) => {
    try {

        let res = await axios.post(`${apiConfig.NowPayment_API}invoice` , {
            price_amount : amount,
            price_currency : unit,
            order_id : "FiatDeposit-" + user_id + "-" + order_id,
            order_description : 'CALAHEX Deposit Fiat 2022 x 1',
            ipn_callback_url : 'https://nowpayments.io',
            success_url: "https://nowpayments.io",
            cancel_url: "https://nowpayments.io"
        } , {
            headers :{
                'x-api-key' : 'S7NVMMP-T7VMSG5-JKYV2WW-RP2V62N',
                'Content-Type' : 'application/json'
            }
        });

        console.log(res.data.invoice_url);
        return res.data.invoice_url;
    } catch(err){
        console.log(err);
        return false ;
    }
}

export const GetLimitAmount = async (fromCrypto, toCrypto) => {
    try {
        let res = await axios.get(`${apiConfig.Sandbox_NowPayment_API}min-amount?currency_from=${fromCrypto}&currency_to=${toCrypto}` , {
            headers : {
                'x-api-key': `${process.env.sandbox_nowpayment_api_key}`
            }
        })

        return res.data['min_amount'] ;

    } catch(err) {
        return null ;
    }
}

export const CreatePayment = async (crypto, amount, order_id) => {
    try {
        let res = await axios.post(`${apiConfig.Sandbox_NowPayment_API}payment` , {
            price_amount : 1,
            price_currency : "usd",
            pay_amount : amount,
            pay_currency : crypto,
            ipn_callback_url : "https://nowpayments.io",
            order_id : order_id,
            order_description : 'CA1EX Deposit Crypto 2022 x 1'
        }, {
            headers : {
                'x-api-key': `${process.env.sandbox_nowpayment_api_key}`,
                'Content-Type' : 'application/json'
            }
        }) ;

        return res.data ;
    } catch(err) {
        console.log(err) ;

        return null ;
    }
}

export const StatusPayment = async (payment_id) => {
    try {
        let res = await axios.get(`${apiConfig.Sandbox_NowPayment_API}payment/${payment_id}`, {
            headers : {
                'x-api-key': `${process.env.sandbox_nowpayment_api_key}`,
            }
        }) ;

        console.log(res.data) ;

        return res.data ;

    } catch(err) {

        return null ;
    }
}