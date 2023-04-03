import ControllerUtils from '../../utils/ControllerUtils' ;
import { delUploadedFile, isset } from '../../utils/Helper';
import { CurrencyRates } from '../../services/ChainService';

import {
    Cryptos
} from '../../schemas' ;

import AppError from '../../utils/AppError';

class CryptoController extends ControllerUtils {
  
    constructor() {
        super() ;

        // if you are not defined this, you will use signUp function but you can't use async and await.
        this.baseCryptoList = this.baseCryptoList.bind(this) ;
        this.cryptoList = this.cryptoList.bind(this) ;
        this.addCrypto = this.addCrypto.bind(this);
    }

    async baseCryptoList(req, res, next) {
        const cryptos = await Cryptos.find({
            is_base_coin : true
        }) ;

        let baseCryptoList = [] ;

        for(let crypto of cryptos) {
            baseCryptoList.push({
                symbol : crypto.symbol,
                id : crypto.id,
            })    
        }

        return res.status(200).json({
            baseCryptoList : baseCryptoList
        })
    }
    async cryptoList (req, res, next) {

        const cryptos = await Cryptos.find({}) ;

        if(!cryptos) return next(new AppError(403, "cryptoList", "Get crypto list failed."), req, res, next) ;

        let cryptoList = [] ;

        for(let crypto of cryptos) {
            let pairList = [] ;
            let initialPrice = {} ;

            for(let pair_id of crypto.pair) {
                let pair = await Cryptos.findOne({
                    _id : pair_id
                }) ;

                pairList.push({
                    symbol : pair.symbol,
                    id : pair._id,
                }) ;
            }
            if(crypto.initial_price) initialPrice = crypto.initial_price ;

            cryptoList.push({
                ...crypto.toJSON(),
                pair : pairList,
                initial_price : initialPrice
            }) ;
        }
        res.status(200).json({
            cryptoList : cryptoList
        });
    }

    async updateCrypto(req, res, next) {

        const {
            crypto_id , name, symbol, decimal, address, deposit_fee, withdraw_fee, transaction_fee, transfer_fee, is_deposit, is_withdraw, is_base,
            pair_list,
        } = req.body;


        let crypto = await Cryptos.findOne({
            _id : crypto_id
        }) ;

        if(!crypto) return next(new AppError(403, 'addCrypto' , 'Crypto does not exist')) ;

        crypto.name = name ;
        crypto.symbol = symbol ;
        crypto.decimal = decimal ;
        crypto.address = address ;
        crypto.deposit_fee = Number(deposit_fee) ;
        crypto.withdraw_fee = Number(withdraw_fee)  ;
        crypto.transfer_fee = Number(transfer_fee) ;
        crypto.transaction_fee = Number(transaction_fee) ;
        crypto.is_deposit_coin = Boolean(is_deposit) ;
        crypto.is_withdraw_coin = Boolean(is_withdraw) ;
        crypto.is_base_coin = Boolean(is_base) ;

        if(isset(req.files.logo)) {
            crypto.logo = 'logos/' + req.files.logo[0].filename ;
        }

        if(isset(req.files.paper)) {
            crypto.whitepaper = 'papers/' + req.files.paper[0].filename ;
        }

        await crypto.save() ;

        let pairList = [] ;
        let initialPrice = {} ;

        for(let list of JSON.parse(pair_list)) {
            if(typeof list === 'object' && list) {
                if( list.hasOwnProperty('id')) {
                    let pair = await Cryptos.findOne({
                        _id : list.id
                    }) ;
    
                    if(pair) {
                        let thirdparty_price = await CurrencyRates(crypto.symbol) ;
    
                        console.log(thirdparty_price[pair.symbol]) ;

                        pairList.push(list.id) ;
                        initialPrice[list.id] = (thirdparty_price && thirdparty_price.hasOwnProperty(pair.symbol)) ? thirdparty_price[pair.symbol] : 0 ;
                    }
                }
            }
        }

        if(pairList.length && Object.keys(initialPrice).length) {
            crypto.pair = pairList ;
            crypto.initial_price = initialPrice ;
            await crypto.save() ;
        } 
        
        res.status(200).json({
            crypto : crypto
        }) ;
    }
    async addCrypto(req, res, next) {
        
        const {
            name, symbol, decimal, address, deposit_fee, withdraw_fee, transaction_fee, transfer_fee, is_deposit, is_withdraw, is_base,
            pair_list,
        } = req.body;


        let crypto = await Cryptos.findOne({
            symbol : symbol
        }) ;

        if(crypto) return next(new AppError(403, 'addCrypto' , 'Crypto already exist')) ;

        crypto = await Cryptos.store({
            name : name,
            symbol : symbol,
            decimal : Number(decimal),
            address : address,
            deposit_fee : Number(deposit_fee),
            withdraw_fee : Number(withdraw_fee),
            transfer_fee : Number(transfer_fee),
            transaction_fee : Number(transaction_fee),
            is_deposit_coin : Boolean(is_deposit),
            is_withdraw_coin : Boolean(is_withdraw),
            is_base_coin : Boolean(is_base),
            logo : 'logos/' + req.files.logo[0].filename,
            whitepaper : 'papers/' + req.files.paper[0].filename
        }) ;

        if(!crypto) return next(new AppError(403, 'addCrytpo' , 'Add Crypto Failed.'), req, res, next) ;

        let pairList = [] ;
        let initialPrice = {} ;

        for(let list of JSON.parse(pair_list)) {

            if(typeof list === 'object' && list) {
                if( list.hasOwnProperty('id')) {
                    let pair = await Cryptos.findOne({
                        _id : list.id
                    }) ;
    
                    if(pair) {
                        let thirdparty_price = await CurrencyRates(pair.symbol) ;
    
                        pairList.push(list.id) ;
                        initialPrice[list.id] = (thirdparty_price && thirdparty_price.hasOwnProperty(pair.symbol)) ? thirdparty_price[pair.symbol] : 0 ;
                    }
                }
            }
        }

        if(pairList.length && Object.keys(initialPrice).length) {
            crypto.pair = pairList ;
            crypto.initial_price = initialPrice ;
            await crypto.save() ;
        } 
        
        res.status(200).json({
            crypto : crypto
        }) ;
    }

    async deleteCrypto(req, res, next) {

        let crypto = await Cryptos.findOne({
            _id : req.body._id
        }) ;

        await delUploadedFile(crypto.whitepaper) ;
        await delUploadedFile(crypto.logo) ;

        const result = await Cryptos.delete(req.body) ;

        if(!result) return next(new AppError(403, 'deleteCrypto', 'Delete crypto failed.'), req, res, next) ;

        return res.status(200).json({
            result : 'success'
        }) ;
    }
}
  
export default new CryptoController();