import ControllerUtils from "../../../utils/ControllerUtils";
import { formatDBDate } from "../../../utils/Helper";

import AppError from "../../../utils/AppError";

import { StatusPayment } from "../../../services/PaymentService";

import {
    PayOrders,
    Wallets,
    Accounts,
    Cryptos,
    Orders
} from '../../../schemas' ;

import { WeightedAverage } from "../../../services/SocketService";

class ExchangeController extends ControllerUtils {
    constructor() {
        super() ;

        // you can get information of exchange wallet accounts
        this.walletAccountInfo = this.walletAccountInfo.bind(this) ;
        this.depositAccountInfo = this.depositAccountInfo.bind(this) ;
        this.withdrawAccountInfo = this.withdrawAccountInfo.bind(this) ;

        this.depositHistory = this.depositHistory.bind(this) ;
        this.clearPayHistory = this.clearPayHistory.bind(this) ;
        this.closeDepositHistory = this.closeDepositHistory.bind(this) ;

        this.convertCrypto = this.convertCrypto.bind(this) ;
    }

    async walletAccountInfo(req, res, next) {
        let wallet = await Wallets.findOne({
            user_id : req.user._id,
        });

        if(!wallet) return next(new AppError(403, 'exchangeWalletAccountInfo', "Wallet Does Not Exist.")) ;

        let accounts = await Accounts.find({
            wallet_id : wallet._id,
            account_type : 'exchange'
        }) ;

        if(!accounts.length) return next(new AppError(403, 'exchangeWalletAccountInfo', "Any Accounts Do Not Exist."));

        let exchangeWalletAccountInfo = [] ;

        for(let account of accounts) {
            let crypto = await Cryptos.findOne({
                _id : account.crypto_id
            }) ;

            let pairInfoList = {} ;

            for(let pair_id of crypto.pair) {
                let pair = await Cryptos.findOne({
                    _id : pair_id
                }) ;

                let price = await WeightedAverage(crypto._id, pair._id) ;

                pairInfoList[pair.id] = {
                    id : pair.id,
                    symbol : pair.symbol,
                    logo : pair.logo,
                    price : price
                } ;
            }

            exchangeWalletAccountInfo.push({
                id : crypto._id,
                symbol : crypto.symbol,
                pair : pairInfoList,
                logo : crypto.logo,
                transaction_fee : crypto.transaction_fee,
                total : account.total,
                available : account.available,
                order : account.order,
                is_deposit : crypto.is_deposit_coin,
                is_withdraw : crypto.is_withdraw_coin,
                is_base : crypto.is_base_coin
            }) ;
        }

        return res.status(200).json({
            exchangeWalletAccountInfo : exchangeWalletAccountInfo
        }) ;
    }

    async depositAccountInfo(req, res, next) {
        let depositCryptos = await Cryptos.find({
            is_deposit_coin : true
        }) ;

        let exchangeDepositAccountInfo = {} ;

        for(let depositCrypto of depositCryptos) {
            let account = await Accounts.findOne({
                crypto_id : depositCrypto._id,
                user_id : req.user._id,
                account_type : 'exchange'
            }) ;

            if(!account) {
                exchangeDepositAccountInfo[depositCrypto._id] = {
                    crypto_id : depositCrypto._id,
                    symbol : depositCrypto.symbol,
                    pair : depositCrypto.pair,
                    available : 0,
                    order : 0,
                    total : 0,
                } ;
            } else {
                exchangeDepositAccountInfo[depositCrypto._id] = {
                    crypto_id : depositCrypto._id,
                    symbol : depositCrypto.symbol,
                    pair : depositCrypto.pair,
                    available : account.available,
                    order : account.order,
                    total : account.total
                } ;
            }
        }

        return res.status(200).json({
            exchangeDepositAccountInfo : exchangeDepositAccountInfo
        })
    }

    async withdrawAccountInfo(req, res, next) {
        let withdrawCryptos = await Cryptos.find({
            is_withdraw_coin : true
        }) ;

        let exchangeWithdrawAccountInfo = {} ;

        for(let withdrawCrypto of withdrawCryptos) {
            let account = await Accounts.findOne({
                crypto_id : withdrawCrypto._id,
                user_id : req.user._id,
                account_type : 'exchange'
            }) ;

            if(!account) {
                exchangeWithdrawAccountInfo[withdrawCrypto._id] = {
                    crypto_id : withdrawCrypto._id,
                    symbol : withdrawCrypto.symbol,
                    pair : withdrawCrypto.pair,
                    available : 0,
                    order : 0,
                    total : 0,
                } ;
            } else {
                exchangeWithdrawAccountInfo[withdrawCrypto._id] = {
                    crypto_id : withdrawCrypto._id,
                    symbol : withdrawCrypto.symbol,
                    pair : withdrawCrypto.pair,
                    available : account.available,
                    order : account.order,
                    total : account.total
                } ;
            }
        }

        return res.status(200).json({
            exchangeWithdrawAccountInfo : exchangeWithdrawAccountInfo
        })
    }

    async clearPayHistory(req, res, next) {
        let pay_order = await PayOrders.findOne({
            _id : req.body.pay_order_id
        }) ;

        if(!pay_order) return next(new AppError(403, 'clearHistory', 'Pay Order does not exist.')) ;

        pay_order.cleared = true ;
        await pay_order.save() ;

        return res.status(200).json({
            status : 'success'
        });
    }

    async closeDepositHistory(req, res, next) {
        console.log(req.body.pay_order_id) ;
        let pay_order = await PayOrders.findOne({
            _id : req.body.pay_order_id
        }) ;

        if(!pay_order) return next(new AppError(403, 'closeDepositHistory', 'Pay Order does not exist.')) ;

        pay_order.status = 'cancelled' ;
        await pay_order.save() ;

        return res.status(200).json({
            status : 'success'
        });
    }

    async depositHistory(req, res, next) {
        let pay_orders = await PayOrders.findAndSort({
            user_id : req.user._id,
            payment_type : "deposit",
            cleared : false
        }, { createdAt : -1 }) ;

        if(!pay_orders) return next(new AppError(403, 'depositHistory', 'Get Exchange Deposit History Failed'), req, res, next) ;
        
        let exchangeDepositHistory = [] ;

        let isPending = false ;
        for(let pay_order of pay_orders){

            let response = await StatusPayment(pay_order.payment_id) ;

            // waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired
            if( response && pay_order.status !== 'finished' && pay_order.status !== 'cancelled' && pay_order.status !== 'failed'){
                isPending = true ;

                if(pay_order.status !== response.payment_status) {
                    if(response.payment_status === 'finished') {
                        
                        let wallet = await Wallets.findOne({
                            user_id : pay_order.user_id
                        }) ;

                        let account = await Accounts.findOne({
                            wallet_id : wallet._id,
                            crypto_id : pay_order.crypto_id
                        }) ;

                        if(!account) {
                            account = await Accounts.store({
                                wallet_id : wallet._id,
                                crypto_id : pay_order.crypto_id,
                                available : Number(response.actually_paid),
                                order : 0 ,
                                total : Number(response.actually_paid)
                            })
                        } else {
                            account.available += parseFloat(response.actually_paid) ;
                            account.total = account.available + account.order ;
                            await account.save() ;
                        }
                        
                        pay_order.amount = response.pay_amount ;
                        pay_order.amount_left = response.pay_amount - response.actually_paid ;
                    }
                    pay_order.status = response.payment_status ;

                    await pay_order.save() ;
                }
            }

            exchangeDepositHistory.push({
                id : pay_order._id,
                payment_id : pay_order.payment_id,
                crypto : pay_order.unit,
                amount : pay_order.amount,
                status : pay_order.status,
                createdAt : formatDBDate(pay_order.createdAt, 'datetime')
            }) ;
        }

        res.status(200).json({
            exchangeDepositHistory : exchangeDepositHistory,
            isPending : isPending ,
        })
    }

    async withdrawHistory(req, res, next) {
        let pay_orders = await PayOrders.findAndSort({
            user_id : req.user._id,
            payment_type : "withdraw",
            cleared : false
        }, { createdAt : -1 }) ;

        if(!pay_orders) return next(new AppError(403, 'withdrawHistory', 'Get Exchange Withdraw History Failed')) ;
        
        let exchangeWithdrawHistory = [] ;

        let isPending = false ;
        for(let pay_order of pay_orders){
            // waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired
            if(pay_order.status !== 'finished' && pay_order.status !== 'failed') isPending = true ;

            exchangeWithdrawHistory.push({
                id : pay_order._id,
                payment_id : pay_order.payment_id,
                crypto : pay_order.unit,
                amount : pay_order.amount,
                status : pay_order.status,
                createdAt : formatDBDate(pay_order.createdAt, 'datetime')
            }) ;
        }

        res.status(200).json({
            exchangeWithdrawHistory : exchangeWithdrawHistory,
            isPending : isPending ,
        })
    }

    async convertCrypto(req, res, next) {
        const {
            crypto_id,
            pair_id,
            convert_amount
        } = req.body ;

        let crypto = await Cryptos.findOne({
            _id : crypto_id 
        }) ;

        if(!crypto) return next(new AppError(403, 'convertCrypto', 'Crypto does not exist')) ;

        let pair = await Cryptos.findOne({
            _id : pair_id
        }) ;

        if(!pair) return next(new AppError(403, 'convertCrypto', 'Pair does not exist')) ;

        let wallet = await Wallets.findOne({
            user_id : req.user._id
        }) ;

        let fromAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : crypto_id,
            account_type : 'exchange'    
        }) ;

        if(Number(fromAccount.available) < Number(convert_amount)) 
            return next(new AppError(403, 'convertCrypto', 'Inffucient funds.')) ;

        let toAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : pair_id,
            accoun_ttype : 'exchange'
        }) ;

        let price = await WeightedAverage(crypto_id, pair_id) ;

        let pair_amount = Number(price) * Number(convert_amount) ;

        let real_pair_amount = Number(pair_amount) * Number(crypto.transaction_fee) ;

        if(!toAccount) {
            await Accounts.store({
                wallet_id : wallet._id,
                crypto_id : pair_id,
                account_type : 'exchange',
                available : real_pair_amount ,
                order : 0,
                total : real_pair_amount
            }) ;
        } else {
            toAccount.available += real_pair_amount ;
            toAccount.total = Number(toAccount.available) + Number(toAccount.order) ;

            await toAccount.save() ;
        }

        fromAccount.available -= Number(convert_amount) ;
        fromAccount.total -= Number(convert_amount) ;

        await fromAccount.save() ;

        let order = await Orders.store({
            user_id : req.user._id,
            crypto_id : crypto._id,
            crypto_amount : Number(convert_amount),
            pair_id : pair._id,
            pair_amount : Number(pair_amount),
            type : 'convert',
            price : price ,
            fee : Number(pair_amount) - Number(real_pair_amount),
            pay_type : 'market',
            filled : toAccount.available,
            status : 1
        }) ;

        if(!order) return next(new AppError(403, 'convertCrypto' , 'Order create failed')) ;

        return res.status(200).json({
            status : 'success'
        }) ; 
    }
}

export default new ExchangeController() ;