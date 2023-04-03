import ControllerUtils from "../../../utils/ControllerUtils";
import AppError from "../../../utils/AppError";

import { CurrencyRates } from "../../../services/ChainService";

import {
    Wallets,
    Cryptos,
    Accounts
} from '../../../schemas' ;

import { isset } from "../../../utils/Helper";

class AccountController extends ControllerUtils {
    constructor() {
        super() ;

        this.wholeCryptoBalance = this.wholeCryptoBalance.bind(this) ;
        this.walletAccountInfo = this.walletAccountInfo.bind(this) ;
        this.transferCrypto = this.transferCrypto.bind(this) ;
    }

    async walletAccountInfo(req, res, next) {

        let cryptos = await Cryptos.find({}) ;

        let crypto_usdt_rates = {} ;

        for(let crypto of cryptos) {
            let crypto_rates = await CurrencyRates(crypto.symbol) ;

            let rate = 0 ;
            if(crypto_rates) rate = crypto_rates.USDT ;

            crypto_usdt_rates[crypto._id] = rate ;
        }

        let wallet = await Wallets.findOne({
            user_id : req.user._id
        }) ;

        let accounts = await Accounts.find({
            wallet_id : wallet._id,
        }) ;

        let total_balance = 0 ;
        let exchange_balance = 0 ;
        let margin_balance = 0;
        let pool_balance = 0;
        let future_balance = 0;
        let savings_balance = 0 ;

        for(let account of accounts){
            total_balance += account.total * crypto_usdt_rates[account.crypto_id] ;

            switch(account.account_type){
                case 'exchange' :
                    exchange_balance += account.total * crypto_usdt_rates[account.crypto_id] ;
                    break ;
                case 'margin' :
                    margin_balance += account.total * crypto_usdt_rates[account.crypto_id] ;
                    break ;
                case 'pool' :
                    pool_balance += account.total * crypto_usdt_rates[account.crypto_id] ;
                    break ;
                case 'future' : 
                    future_balance += account.total * crypto_usdt_rates[account.crypto_id] ;
                    break ;
                case 'savings' :
                    savings_balance += account.total * crypto_usdt_rates[account.crypto_id] ;
                    break ;
                default :
                    break ;
            }
        }
        
        return res.status(200).json({
            total_balance : total_balance,
            exchange_balance : exchange_balance,
            margin_balance : margin_balance,
            pool_balance : pool_balance,
            future_balance : future_balance,
            savings_balance : savings_balance
        }) ;
    }

    async wholeCryptoBalance(req, res, next) {

        let wallet = await Wallets.findOne({
            user_id : req.user._id
        })

        let cryptos = await Cryptos.findAndSort({} , { symbol : 1 }) ;
        
        let wholeCryptoBalance = {} ;
 
        wholeCryptoBalance['total'] = {} ;

        for(let crypto of cryptos) {
            let accounts = await Accounts.find({
                wallet_id : wallet._id,
                crypto_id : crypto._id,
            });

            if(accounts) {
                for(let account of accounts) {
                    let crypto_available = account.available ;
                    let crypto_order = account.order ;
                    let crypto_total = account.total ;

                    if(account.total !== 0){
                        if(!isset(wholeCryptoBalance[account.account_type])) {
                            wholeCryptoBalance[account.account_type] = {} ;
                        }
                        if(!isset( wholeCryptoBalance['total'][crypto._id] )) {
                            wholeCryptoBalance['total'][crypto._id] = {
                                available : 0,
                                total : 0
                            } ;
                        }

                        wholeCryptoBalance["total"][crypto._id]["available"] += account.available ; 
                        wholeCryptoBalance["total"][crypto._id]["total"] += account.total ; 

                        wholeCryptoBalance[account.account_type][crypto._id] = {
                            crypto : {
                                id : crypto._id,
                                name : crypto.name,
                                symbol : crypto.symbol,
                                logo : crypto.logo,
                                transfer_fee : crypto.transfer_fee,
                                is_based : crypto.is_base_coin,
                                is_deposit : crypto.is_deposit_coin,
                                is_withdraw : crypto.is_withdraw_coin
                            },
                            available : crypto_available,
                            order : crypto_order,
                            total : crypto_total
                        } ;
                    }
                }
            }
        }
     
        return res.status(200).json({
            wholeCryptoBalance : wholeCryptoBalance
        }) ;
    }

    async transferCrypto(req, res, next) {
        
        if(req.body.fromAccount === req.body.toAccount) return next(new AppError(403, 'transferCrypto', "You cant't transfer between same accounts."))

        if(Number(req.body.transferAmount) <= 0) return next(new AppError(403, "transferCrypto", "Transfer Amount is invalid."));

        let crypto = await Cryptos.findOne({
            _id : req.body.transferCoin
        }) ;

        let wallet = await Wallets.findOne({
            user_id : req.user._id
        }) ;

        let fromAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : req.body.transferCoin,
            account_type : req.body.fromAccount
        }) ;

        if(!fromAccount) return next(new AppError(403, "transferCrypto", "From Account Does Not Exist.")) ;

        let toAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : req.body.transferCoin,
            account_type : req.body.toAccount
        }) ;

        if(!toAccount) {
            toAccount = await Accounts.store({
                wallet_id : wallet._id,
                crypto_id : req.body.transferCoin,
                account_type : req.body.toAccount,
                available : 0,
                order : 0,
                total : 0
            })
        } 

        if(fromAccount.available < Number(req.body.transferAmount)) {
            return next(new AppError(403, 'transferCrypto', 'Inffucient Funds.')) ;
        }

        fromAccount.available -= Number(req.body.transferAmount) ;
        fromAccount.total = Number(fromAccount.available) + Number(fromAccount.order) ;

        await fromAccount.save() ;

        toAccount.available += Number(req.body.transferAmount) * (1 - Number(crypto.transfer_fee) / 100 );
        toAccount.total = Number(toAccount.available) + Number(toAccount.order) ;

        await toAccount.save() ;

        return res.status(200).json({
            status : 'success'
        }) ;
    }
}

export default new AccountController() ;