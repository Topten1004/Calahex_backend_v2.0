import ControllerUtils from "../../utils/ControllerUtils";
import AppError from "../../utils/AppError";
import { formatDBDate } from "../../utils/Helper";

import { CurrencyRates} from '../../services/ChainService';
import { BroadcastMarketInfo, WeightedAverage } from "../../services/SocketService";

import {
    Orders,
    Cryptos,
    Wallets,
    Accounts
} from '../../schemas' ;

class ExchangeController extends ControllerUtils {
    constructor() {
        super() ;

        this.exchangeByMarket = this.exchangeByMarket.bind(this) ;
        this.exchangeByLimit = this.exchangeByLimit.bind(this) ;
        this.exchangeCrypto = this.exchangeCrypto.bind(this) ;
        this.exchangeByNormal = this.exchangeByNormal.bind(this) ;
        
        this.addOrderBook = this.addOrderBook.bind(this) ;
        this.fullTradeOrder = this.fullTradeOrder.bind(this) ;
        this.lessTradeOrder = this.lessTradeOrder.bind(this) ;
        this.automaticTradeOrder = this.automaticTradeOrder.bind(this) ;

        this.userOrderList = this.userOrderList.bind(this) ;
        this.cryptoBalance = this.cryptoBalance.bind(this) ;

        this.userOrderClear = this.userOrderClear.bind(this) ;
        this.userOrderCancel = this.userOrderCancel.bind(this) ;
    }

    async exchangeByMarket(req, res, next) {
        const { crypto_id, pair_id, crypto_amount , pair_amount, method } = req.body ;
        const user = req.user ;

        let crypto = await Cryptos.findOne({
            _id : crypto_id
        }) ;

        if(!crypto) return next(new AppError(403, 'exchangeByMarket', 'Crypto does not exist.')) ;
        
        let pair = await Cryptos.findOne({
            _id : pair_id
        }) ;

        if(!pair) return next(new AppError(403,  'exchangeByMarket', 'Pair does not exist.')) ;

        // WeightedAverage funtion is defined inside ../Service/SocketService.js.
        // At the first, you have to get weighted average trade price about current crypto and pair from orders.
        // Weighted average trade price = Sum of(prices * amount) / Sum of ( amount ) 
        let price = await WeightedAverage(crypto._id, pair._id) ;

        if(price === 0) return next(new AppError(403, 'exchangeByMarket', 'Price must not be zero.')) ;

        if( method === 'buy') {
            //  real amount = estimated amount - fee 
            let real_crypto_amount = Number(pair_amount) / Number(price) * ( 1 - Number(pair.transaction_fee) / 100 ) ;

            // Your request is added into order book and exchange by market
            await this.addOrderBook(
                user._id, 
                crypto._id, Number(pair_amount) / Number(price), 
                pair._id, Number(pair_amount) , 
                method , price,
                Number(pair_amount) / Number(price) * Number(pair.transaction_fee) / 100 , 
                'market', 1, next
            ) ;

            await this.exchangeCrypto(user._id, pair._id, Number(pair_amount), crypto._id, real_crypto_amount, next) ;

            // After exchange, market price will be changed. 
            // If so, orders which can trade have to trade immediately.
            await this.automaticTradeOrder(crypto._id, pair._id, next) ;

            // Finally, order book will be changed and server have to broadcast this changes to all client. 
            await BroadcastMarketInfo(crypto._id, pair._id) ;
        } else if( method === 'sell') {
            // This function logic is same as <buy> function.
            let real_pair_amount = Number(crypto_amount) * Number(price) *  ( 1 - Number(crypto.transaction_fee) / 100 ) ;

            await this.addOrderBook(
                                        user._id, 
                                        crypto._id, Number(crypto_amount), 
                                        pair._id, Number(crypto_amount) * Number(price), 
                                        method , price,
                                        Number(crypto_amount) * Number(price) * Number(crypto.transaction_fee) / 100 , 
                                        'market' , 1, next
                                    ) ;

            await this.exchangeCrypto(user._id, crypto._id, Number(crypto_amount), pair._id, real_pair_amount, next) ;

            await this.automaticTradeOrder(crypto._id, pair._id) ;

            await BroadcastMarketInfo(crypto._id, pair._id) ;
        }
        res.status(200).json({
            status : 'success'
        }) ;
    }
    
    async exchangeByLimit(req, res, next) {
        const { price , crypto_id, pair_id, crypto_amount , pair_amount, method } = req.body ;
        const user = req.user ;

        let crypto = await Cryptos.findOne({
            _id : crypto_id
        }) ;

        if(!crypto) return next(new AppError(403, 'exchangeByLimit', 'Crypto does not exist.')) ;
        
        let pair = await Cryptos.findOne({
            _id : pair_id
        }) ;

        if(!pair) return next(new AppError(403,  'exchangeByLimit', 'Pair does not exist.')) ;

        let market_price = await WeightedAverage(crypto._id, pair._id) ;

        if( method === 'buy') {
            let real_crypto_amount = Number(pair_amount) / Number(price) * ( 1 - Number(pair.transaction_fee) / 100 ) ;
            
            if(market_price > Number(price) ) {
                // If market price is higher than request price, your request is only added into order book.
                // Added order will be trade when order price reached to market price.
                await this.addOrderBook(
                    user._id, 
                    crypto._id, Number(pair_amount) / Number(price), 
                    pair._id, Number(pair_amount) , 
                    method , Number(price),
                    Number(pair_amount) / Number(price) * Number(pair.transaction_fee) / 100 , 
                    'limit',  0 , next
                ) ;
            } else {
                // If order price is lower than market price, your request is traded immediately.
                await this.addOrderBook(
                    user._id, 
                    crypto._id, Number(pair_amount) / Number(price), 
                    pair._id, Number(pair_amount) , 
                    method , price,
                    Number(pair_amount) / Number(price) * Number(pair.transaction_fee) / 100 , 
                    'limit',  1, next
                ) ;

                await this.exchangeCrypto(user._id, pair._id, Number(pair_amount), crypto._id, real_crypto_amount, next) ;

                await this.automaticTradeOrder(crypto._id, pair._id, next) ;
            }

            await BroadcastMarketInfo(crypto._id, pair._id) ;
        } else if( method === 'sell') {
            let real_pair_amount = Number(crypto_amount) * Number(price) *  ( 1 - Number(crypto.transaction_fee) / 100 ) ;

            if(market_price < Number(price)) {
                await this.addOrderBook(
                                            user._id, 
                                            crypto._id, Number(crypto_amount), 
                                            pair._id, Number(crypto_amount) * Number(price), 
                                            method , price,
                                            Number(crypto_amount) * Number(price) * Number(crypto.transaction_fee) / 100 , 'limit' , 0 , next
                                        ) ;
            } else {
                await this.addOrderBook(
                                            user._id, 
                                            crypto._id, Number(crypto_amount), 
                                            pair._id, Number(crypto_amount) * Number(price), 
                                            method , price,
                                            Number(crypto_amount) * Number(price) * Number(crypto.transaction_fee) / 100 , 'limit' , 1, next
                                        ) ;

                await this.exchangeCrypto(user._id, crypto._id, Number(crypto_amount), pair._id, real_pair_amount, next) ;

                await this.automaticTradeOrder(crypto._id, pair._id, next) ;
            }
            await BroadcastMarketInfo(crypto._id, pair._id) ;
        }
        res.status(200).json({
            status : 'success'
        }) ;
    }

    async exchangeByNormal(req, res, next) {
        const { orderer_id, crypto_id, crypto_amount, pair_id, pair_amount, method } = req.body ;
        const user = req.user ;

        let order = await Orders.findOne({
            _id : orderer_id
        }) ;

        if(!order) return next(new AppError(403 , 'exchangeByNormal', 'Order does not exist.')) ;

        let wallet = await Wallets.findOne({
            user_id : user._id
        }) ;

        if(!wallet) return next(new AppError(403, 'exchangeByNormal', 'Wallet does not exist.')) ;

        let crypto = await Cryptos.findOne({
            _id : order.crypto_id
        }) ;

        if(!crypto) return next(new AppError(403, 'exchangeByNormal', 'Crypto does not exist.')) ;
        
        if(crypto._id.toString() !== crypto_id) return next(new AppError(403, 'exchangeByNormal', "Order's crypto id is not match with crypto id.")) ;

        let pair = await Cryptos.findOne({
            _id : order.pair_id
        }) ;

        if(!pair) return next(new AppError(403, 'exchangeByNormal', 'Pair does not exist.')) ;

        if(pair._id.toString() !== pair_id) return next(new AppError(403, 'exchangeByNormal', "Order's pair id is not match with pair id.")) ;

        if(order.type === 'buy' && method !== 'sell') 
            return next(new AppError(403, 'exchangeByNormal', "You can only sell crypto with this order."));
        
        if(order.type === 'sell' && method !== 'buy')
            return next(new AppError(403, 'exchangeByNormal', 'You can only buy crypto with this order.')) ;

        if(order.type === 'sell') {

            if(Number(pair_amount) > Number(order.pair_amount)) {

                let real_crypto_amount = Number(order.crypto_amount) * (1 - Number(pair.transaction_fee) / 100) ;

                await this.addOrderBook(
                    user._id, 
                    crypto._id, Number(order.crypto_amount), 
                    pair._id, Number(order.pair_amount) , 
                    'buy' , Number(order.price),
                    Number(order.crypto_amount) * Number(pair.transaction_fee) / 100 , 
                    'normal',  1, next
                ) ;

                await this.exchangeCrypto(user._id, pair._id, Number(order.pair_amount), crypto._id, real_crypto_amount, next) ;

                await this.fullTradeOrder(orderer_id, next) ;

                await this.addOrderBook(
                    user._id, 
                    crypto._id, Number(pair_amount) / Number(order.price) - Number(order.crypto_amount), 
                    pair._id, Number(pair_amount) - Number(order.pair_amount) , 
                    'buy' , Number(order.price),
                    ( Number(pair_amount) / Number(order.price) - Number(order.crypto_amount) ) * Number(pair.transaction_fee) / 100 , 
                    'normal',  0, next
                ) ;

                await this.automaticTradeOrder(crypto._id, pair._id, next) ;

            } else if( Number(pair_amount) < Number(order.pair_amount) ) {
                let real_crypto_amount = Number(pair_amount) / Number(order.price) * ( 1 - Number(pair.transaction_fee) / 100 ) ;

                await this.addOrderBook(
                    user._id, 
                    crypto._id, Number(pair_amount) / Number(order.price), 
                    pair._id, Number(pair_amount) , 
                    'buy' , Number(order.price),
                    Number(pair_amount) / Number(order.price) * Number(pair.transaction_fee) / 100 , 
                    'normal', 1, next
                ) ;
                
                await this.exchangeCrypto(user._id, pair._id, Number(pair_amount), crypto._id, real_crypto_amount, next) ;

                await this.lessTradeOrder(orderer_id,  Number(pair_amount) / Number(order.price) , Number(pair_amount) , next) ;

                await this.addOrderBook(
                    user._id, 
                    crypto._id, Number(pair_amount) / Number(order.price), 
                    pair._id, Number(pair_amount) , 
                    order.type , Number(order.price),
                    Number(pair_amount) / Number(order.price) * Number(pair.transaction_fee) / 100 , 
                    order.pay_type , 1, next
                ) ;

                await this.automaticTradeOrder(crypto._id, pair._id, next) ;
            } else {
                let real_crypto_amount = Number(order.crypto_amount) * (1 - Number(pair.transaction_fee) / 100) ;

                await this.addOrderBook(
                    user._id, 
                    crypto._id, Number(order.crypto_amount), 
                    pair._id, Number(order.pair_amount) , 
                    'buy' , Number(order.price),
                    Number(order.crypto_amount) * Number(pair.transaction_fee) / 100 , 
                    'normal',  1, next
                ) ;

                await this.exchangeCrypto(user._id, pair._id, Number(order.pair_amount), crypto._id, real_crypto_amount, next) ;

                await this.fullTradeOrder(orderer_id, next) ;

                await this.automaticTradeOrder(crypto._id, pair._id, next) ;
            }

            await BroadcastMarketInfo(crypto._id, pair._id) ;
        } 
        if(order.type === 'buy') {
            if(Number(crypto_amount) > order.crypto_amount) {
                let real_pair_amount = Number(order.pair_amount) * (1 - Number(crypto.transaction_fee) / 100) ;

                await this.addOrderBook(
                    user._id,
                    crypto._id, Number(order.crypto_amount) ,
                    pair._id , Number(order.pair_amount),
                    'sell', Number(order.price),
                    Number(order.pair_amount) * Number(crypto.transaction_fee) / 100,
                    'normal', 1, next
                ) ;

                await this.exchangeCrypto(user._id, crypto._id, Number(order.crypto_amount), pair._id, real_pair_amount, next) ;

                await this.fullTradeOrder(orderer_id, next) ;

                await this.addOrderBook(
                    user._id,
                    crypto._id, Number(crypto_amount) - Number(order.crypto_amount) ,
                    pair._id, ( Number(crypto_amount) * Number(order.price) - Number(order.pair_amount) ),
                    'sell',  Number(order.price) ,
                    ( Number(crypto_amount) * Number(order.price) - Number(order.pair_amount) ) * Number(crypto.transaction_fee) / 100,
                    'normal', 0, next
                ) ;

                await this.automaticTradeOrder(crypto._id, pair._id, next) ;
            } else if(Number(crypto_amount) < order.crypto_amount) {
                let real_pair_amount = Number(pair_amount) * (1 - Number(crypto.transaction_fee) / 100) ;

                await this.addOrderBook(
                    user._id,
                    crypto._id, Number(crypto_amount),
                    pair._id, Number(crypto_amount) * Number(order.price),
                    'sell', Number(order.price),
                    Number(crypto_amount) * Number(order.price) * Number(crypto.transaction_fee) / 100,
                    'normal', 1, next
                );

                await this.exchangeCrypto(user._id, crypto._id, Number(crypto_amount), pair._id, real_pair_amount, next) ;

                await this.lessTradeOrder(orderer_id, Number(crypto_amount), Number(crypto_amount) * Number(order.price), next) ; 

                await this.addOrderBook(
                    user._id,
                    crypto._id, Number(crypto_amount),
                    pair._id, Number(crypto_amount) * Number(order.price),
                    order.type, Number(order.price),
                    Number(crypto_amount) * Number(order.price) * Number(crypto.transaction_fee) / 100,
                    order.pay_type, 1, next
                );

                await this.automaticTradeOrder(crypto._id, pair._id, next) ;
            } else {
                let real_pair_amount = Number(order.pair_amount) * (1 - Number(crypto.transaction_fee) / 100) ;

                await this.addOrderBook(
                    user._id,
                    crypto._id, Number(order.crypto_amount) ,
                    pair._id , Number(order.pair_amount),
                    'sell', Number(order.price) ,
                    Number(order.pair_amount) * Number(crypto.transaction_fee) / 100,
                    'normal', 1, next
                ) ;

                await this.exchangeCrypto(user._id, crypto._id, Number(order.crypto_amount), pair._id, real_pair_amount, next) ;

                await this.fullTradeOrder(orderer_id, next) ;

                await this.automaticTradeOrder(crypto._id, pair._id, next) ;
            }

            await BroadcastMarketInfo(crypto._id, pair._id) ;
        }

        return res.status(200).json({
            status : 'success'
        });
    }

    async addOrderBook (user_id, crypto_id, crypto_amount, pair_id, pair_amount, type, price, fee, pay_type, status, next) {
        let wallet = await Wallets.findOne({
            user_id : user_id
        });

        if(!wallet) return next(new AppError(403, 'addOrderBook', 'Wallet does not exist')) ;

        let cryptoAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : crypto_id,
            account_type : 'exchange'
        }) ;

        if(!cryptoAccount) {
            if(type === 'buy') {
                cryptoAccount = await Accounts.store({
                    wallet_id : wallet._id,
                    crypto_id : crypto_id,
                    account_type : 'exchange'
                })
            } else if(type === 'sell') {
                return next(new AppError(403, 'addOrderBook' , 'Crypto account does not exist.')) ;
            }
        }
        
        let pairAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : pair_id,
            account_type : 'exchange'
        }) ;

        if(!pairAccount) {
            if(type === 'sell') {
                pairAccount = await Accounts.store({
                    wallet_id : wallet._id,
                    crypto_id : pair_id,
                    account_type : 'exchange'
                })
            } else if(type === 'buy') {
                return next(new AppError(403, 'addOrderBook', 'Pair account does not exist.')) ;
            }
        }
        
        if(type === 'buy') {
            if(Number(pairAccount.available) < Number(pair_amount))
                return next(new AppError(403, 'addOrderBook', ' Inffucient fund.')) ;
            
            if(status === 0) {
                pairAccount.available = Number(pairAccount.available) - Number(pair_amount) ;
                pairAccount.order = Number(pairAccount.order) + Number(pair_amount) ;
                pairAccount.total = Number(pairAccount.available) + Number( pairAccount.order ) ;
                await pairAccount.save() ;
            }
        }
        if(type === "sell") {
            if(Number(cryptoAccount.available) < Number(crypto_amount))
                return next(new AppError(403, 'addOrderBook', "Inffucient fund.")) ;
            
            if(status === 0) {
                cryptoAccount.available = Number(cryptoAccount.available) - Number(crypto_amount);
                cryptoAccount.order = Number(cryptoAccount.order) +  Number(crypto_amount) ;
                cryptoAccount.total = Number(cryptoAccount.order) + Number(cryptoAccount.available) ;
                await cryptoAccount.save() ;
            }
        }
        
        let newOrder = await Orders.store({
            user_id : user_id,
            crypto_id : crypto_id,
            crypto_amount : crypto_amount,
            pair_id : pair_id,
            pair_amount : pair_amount,
            type : type,
            price : price,
            fee : fee,
            pay_type : pay_type,
            filled : cryptoAccount.available,
            status : status,     
        });

        if(!newOrder) return next(new AppError(403, 'addOrderBook', 'New order create failed.'));

        return true ;
    }

    async exchangeCrypto(user_id, fromCrypto_id, fromCrypto_amount, toCrypto_id, toCrypto_amount, next) {
        let wallet = await Wallets.findOne({
            user_id : user_id
        }) ;

        if(!wallet) return next(new AppError(403, 'exchangeCrypto' , 'Wallet does not exist.')) ;

        let fromCryptoAccount = await Accounts.findOne({
            crypto_id : fromCrypto_id,
            wallet_id : wallet._id
        }) ;

        if(!fromCryptoAccount) return next(new AppError(403, 'exchangeCrypto', 'Account does not exist.')) ;

        if(fromCryptoAccount.available < fromCrypto_amount)
            return next(new AppError(403, 'exchangeCrypto', 'Inffucient Funds.')) ;

        fromCryptoAccount.available -= Number(fromCrypto_amount) ;
        fromCryptoAccount.total = Number(fromCryptoAccount.available) + Number(fromCryptoAccount.order) ;
        await fromCryptoAccount.save() ;

        let toCryptoAccount = await Accounts.findOne({
            crypto_id : toCrypto_id,
            wallet_id : wallet._id
        }) ;

        if(!toCryptoAccount) {
            toCryptoAccount = await Accounts.store({
                user_id : user_id,
                wallet_id : wallet._id,
                account_type : 'exchange',
                available : Number(toCrypto_amount) ,
                order : 0,
                total : Number(toCrypto_amount)
            }) ;
        } else {
            toCryptoAccount.available += Number(toCrypto_amount) ;
            toCryptoAccount.total = Number(toCryptoAccount.available) + Number(toCryptoAccount.order) ;

            await toCryptoAccount.save() ;
        }

        return ;
    }

    async fullTradeOrder (orderer_id, next) {
        let order = await Orders.findOne({
            _id : orderer_id
        }) ;

        if(!order) return next(new AppError(403, 'fullTradeOrder' , 'Order does not exist.')) ;

        let wallet = await Wallets.findOne({
            user_id : order.user_id
        }) ;

        if(!wallet) return next(new AppError(403, 'fullTradeOrder' , 'Wallet does not exist.')) ;

        let crypto = await Cryptos.findOne({
            _id : order.crypto_id
        }) ;

        if(!crypto) return next(new AppError(403, 'fullTradeOrder', 'Crypto does not exist.')) ;

        let pair = await Cryptos.findOne({
            _id : order.pair_id
        }) ;

        if(!pair) return next(new AppError(403, 'fullTradeOrder', 'Pair does not exist.')) ;

        let cryptoAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : crypto._id
        }) ;

        if(!cryptoAccount) {
            if(order.type === 'buy') {
                cryptoAccount = await Accounts.store({
                    wallet_id : wallet._id,
                    crypto_id : crypto._id,
                    account_type : 'exchange'
                })
            } else if(type === 'sell') {
                return next(new AppError(403, 'fullTradeOrder' , 'Crypto account does not exist.')) ;
            }
        }

        let pairAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : pair._id
        }) ;

        if(!pairAccount) {
            if(order.type === 'sell') {
                pairAccount = await Accounts.store({
                    wallet_id : wallet._id,
                    crypto_id : pair._id,
                    account_type : 'exchange'
                })
            } else if(type === 'buy') {
                return next(new AppError(403, 'addOrderBook', 'Pair account does not exist.')) ;
            }
        }

        if(order.type === 'sell') {
            cryptoAccount.order = Number(cryptoAccount.order) - Number(order.crypto_amount) ;
            cryptoAccount.total = Number(cryptoAccount.order) + Number(cryptoAccount.available) ;

            await cryptoAccount.save() ;

            let real_pair_amount = Number(order.pair_amount) * (1 - Number(crypto.transaction_fee) / 100) ;
            pairAccount.available = Number(pairAccount.available) + Number(real_pair_amount) ;
            pairAccount.total = Number(pairAccount.available) + Number(pairAccount.order) ;

            await pairAccount.save() ;
        }

        if(order.type === 'buy') {
            pairAccount.order = Number(pairAccount.order) - Number(order.pair_amount) ;
            pairAccount.total = Number(pairAccount.order) + Number(pairAccount.available) ;

            await pairAccount.save() ;

            let real_crypto_amount = Number(order.crypto_amount) * (1 - Number(pair.transaction_fee) / 100) ;

            cryptoAccount.available = Number(cryptoAccount.available) + Number(real_crypto_amount) ;
            cryptoAccount.total = Number(cryptoAccount.available) + Number(cryptoAccount.order) ;

            await cryptoAccount.save() ;
        }

        order.status = 1 ;
        await order.save() ;
    }

    async lessTradeOrder (orderer_id, crypto_amount, pair_amount, next) {

        let order = await Orders.findOne({
            _id : orderer_id
        }) ;

        if(!order) return next(new AppError(403, 'lessTradeOrder' , 'Order does not exist.')) ;

        let wallet = await Wallets.findOne({
            user_id : order.user_id
        }) ;

        if(!wallet) return next(new AppError(403, 'lessTradeOrder', 'Wallet does not exist.')) ;

        let crypto = await Cryptos.findOne({
            _id : order.crypto_id
        }) ;

        if(!crypto) return next(new AppError(403, 'lessTradeOrder', 'Crypto does not exist.')) ;

        let pair = await Cryptos.findOne({
            _id : order.pair_id
        }) ;

        if(!pair) return next(new AppError(403, 'lessTradeOrder', 'Pair does not exist.')) ;

        let cryptoAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : crypto._id
        }) ;

        if(!cryptoAccount) {
            if(order.type === 'buy') {
                cryptoAccount = await Accounts.store({
                    wallet_id : wallet._id,
                    crypto_id : crypto._id,
                    account_type : 'exchange'
                })
            } else if(type === 'sell') {
                return next(new AppError(403, 'lessTradeOrder' , 'Crypto account does not exist.')) ;
            }
        }

        let pairAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : pair._id
        }) ;

        if(!pairAccount) {
            if(order.type === 'sell') {
                pairAccount = await Accounts.store({
                    wallet_id : wallet._id,
                    crypto_id : pair._id,
                    account_type : 'exchange'
                })
            } else if(type === 'buy') {
                return next(new AppError(403, 'addOrderBook', 'Pair account does not exist.')) ;
            }
        }

        if(order.type === 'buy') {
            cryptoAccount.available = Number(cryptoAccount.available) + Number(crypto_amount) ;
            cryptoAccount.total = Number(cryptoAccount.available) + Number(cryptoAccount.order) ;

            await cryptoAccount.save() ;

            pairAccount.order = Number(pairAccount.order) - Number(pair_amount) ;
            pairAccount.total = Number(pairAccount.order) + Number(pairAccount.available) ;

            await pairAccount.save() ;
        }
        if(order.type === 'sell') {
            pairAccount.available = Number(pairAccount.available) + Number(pair_amount) ;
            pairAccount.total = Number(pairAccount.available) + Number(pairAccount.order) ;

            await pairAccount.save() ;

            cryptoAccount.order = Number(cryptoAccount.order) - Number(crypto_amount) ;
            cryptoAccount.total = Number(cryptoAccount.order) + Number(cryptoAccount.available) ;

            await cryptoAccount.save() ;
        }

        let newOrder = await Orders.store({
            user_id : order.user_id,
            crypto : order.crypto_id,
            crypto_amount : crypto_amount,
            pair : order.pair,
            pair_amount : pair_amount,
            type : order.type,
            price : order.price,
            fee : order.fee,
            pay_type : order.pay_type,
            filled : order.filled,
            status : 1,
            cleared : 0
        }) ;

        if(!newOrder) return next(new AppError(403, 'lessTradeOrder', 'Order create fail')) ;

        order.crypto_amount = Number(order.crypto_amount) - Number(crypto_amount) ;
        order.pair_amount = Number(order.pair_amount) - Number(pair_amount) ;
        
        await order.save() ;
    }

    async automaticTradeOrder (crypto_id, pair_id, next) {
        // Calculate changed price
        let market_price = await WeightedAverage(crypto_id, pair_id) ;

        if(!market_price) return next(new AppError(403, 'automaticTradeOrder', 'Market price must not be zero.')) ;

        let orders = await Orders.find({
            status : 0,
        }) ;

        // find orders which can buy .
        // if price is higher than market price, order can trade.
        let buy_orders = orders.filter(list => list.price > market_price && list.type === 'buy') ;

        // find orders which can sell.
        // if price is lower than market price, order can trade.
        let sell_orders = orders.filter(list => list.price < market_price && list.type === 'sell' ) ;

        for(let buy_order of buy_orders) {
            await this.fullTradeOrder(buy_order._id) ;
        }

        for(let sell_order of sell_orders) {
            await this.fullTradeOrder(sell_order._id) ;
        }

        return ;
    }

    async userOrderList(req, res, next) {
        let crypto = await Cryptos.findOne({
            _id : req.body.crypto_id
        })

        if(!crypto) return next(new AppError(403, 'userOrderList'), 'Crypto does not exist') ;
        
        let pair = await Cryptos.findOne({
            _id : req.body.pair_id
        })

        if(!pair) return next(new AppError(403, 'userOrderList', 'Pair does not exist')) ;

        let wallet = await Wallets.findOne({
            user_id : req.user._id
        })

        if(!wallet) return next(new AppError(403, 'userOrderList', 'Wallet does not exist')) ;

        let cryptoAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : crypto._id
        });
        let pairAccount = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : pair._id
        });
        

        let crypto_available = 0 ;
        let crypto_order = 0 ;
        let crypto_total = 0 ;

        if(cryptoAccount) {
            crypto_available = cryptoAccount.available ;
            crypto_order = cryptoAccount.order ;
            crypto_total = cryptoAccount.total ;
        }

        let crypto_rates = await CurrencyRates(crypto.symbol) ;

        let crypto_fund = {
            symbol : crypto.symbol,
            total : crypto_total,
            available : crypto_available,
            order : crypto_order,
            total_usdt_value : Number(crypto_total) * Number(crypto_rates.USDT),
            available_usdt_value : Number(crypto_available) * Number(crypto_rates.USDT)
        }

        let pair_available = 0 ;
        let pair_order = 0 ;
        let pair_total = 0 ;

        if(pairAccount) {
            pair_available = pairAccount.available;
            pair_order = pairAccount.order;
            pair_total = pairAccount.total ;
        }

        let pair_rates = await CurrencyRates(pair.symbol) ;

        let pair_fund = {
            symbol : pair.symbol,
            total : pair_total,
            available : pair_available,
            order : pair_order,
            total_usdt_value : Number(pair_total) * Number(Number(pair_rates.USDT)) ,
            available_usdt_value : Number(pair_available) * Number(Number(pair_rates.USDT))
        }

        let orders = await Orders.findAndSort({
            user_id : req.user._id,
            crypto_id : crypto._id,
            pair_id : pair._id,
            type : {
                '$not' : {
                    '$regex' : 'convert'
                }
            },
            status : {
                '$ne' : null
            },
            cleared : 0
        }, { createdAt : -1 });

        let result = [] ;

        for(let order of orders){
            result.push({
                price : order.price,
                amount : order.crypto_amount,
                total : order.pair_amount,
                status : order.status,
                type : order.pay_type,
                side : order.type,
                fee : order.fee,
                filled : order.filled ? order.filled : 0 ,
                pair : crypto.symbol + "/" + pair.symbol ,
                id : order._id,
                time : formatDBDate(order.createdAt , "datetime")
            })
        }

        orders = await Orders.findAndSort({
            user_id : req.user._id,
            crypto_id : pair._id,
            pair_id : crypto._id,
            type : {
                '$not' : {
                    '$regex' : 'convert'
                }
            },
            status : {
                '$ne' : null
            },
            cleared : 0
        }, { createdAt : -1 }) ;

        for(let order of orders){
            result.push({
                price : order.price,
                amount : order.pair_amount,
                total : order.crypto_amount,
                status : order.status,
                type : order.pay_type,
                side : order.type === 'buy' ? 'sell' : 'buy',
                fee : order.fee,
                filled : order.filled ? order.filled : 0 ,
                pair : crypto.symbol + "/" + pair.symbol,
                id : order._id,
                time : formatDBDate(order.createdAt , "datetime")
            })
        }

        return res.status(200).json({
            userOrderList : result ,
            crypto_fund : crypto_fund,
            pair_fund : pair_fund
        })
    }

    async cryptoBalance(req, res, next) {

        let crypto = await Cryptos.findOne({
            symbol : req.body.symbol
        }) ;

        if(!crypto) return next(new AppError(403, 'cryptoBalance', 'Crypto does not register')) ;

        let wallet = await Wallets.findOne({
            user_id : req.user._id
        }) ;

        if(!wallet) return next(new AppError(403, 'cryptoBalance', 'Wallet does not exist')) ;
        let account = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : crypto._id
        }) ;

        let available = 0 ;

        if(account) available = account.available ;
        
        res.status(200).json({
            available : available
        }) ;
    }
    
    async userOrderCancel(req, res, next) {

        let order = await Orders.findOne({
            _id : req.body.id
        }) ;

        let wallet = await Wallets.findOne({
            user_id : order.user_id
        }) ;

        if(!wallet) return next(new AppError(403, "userOrderCancel", "Wallet does not exist.")) ;

        // If you cancel order, amount transfer from order balance to available balance.
        // if order type is buy, some amount of pair crypto is on order.
        // so, you have to cancel order by 
        if(order.type === 'buy'){
            let pairAccount = await Accounts.findOne({
                wallet_id : wallet._id,
                crypto_id : order.pair_id,
            }) ;

            if(!pairAccount) return next(new AppError(403, 'userOrderCancel', 'Pair account does not exist.')) ;

            pairAccount.available = Number(pairAccount.available) + Number(order.pair_amount) ;
            pairAccount.order = Number(pairAccount.order) - Number(order.pair_amount) ;
            pairAccount.total = Number(pairAccount.available) + Number(pairAccount.order) ;

            await pairAccount.save() ;
        }
        if(order.type === 'sell') {
            let cryptoAccount = await Accounts.findOne({
                wallet_id : wallet._id,
                crypto_id : order.crypto_id
            }) ;

            if(!cryptoAccount) return next(new AppError(403, 'userOrderCancel', 'Crypto account does not exist.')) ;

            cryptoAccount.available = Number(cryptoAccount.available) + Number(order.crypto_amount) ;
            cryptoAccount.order = Number(cryptoAccount.order) - Number(order.crypto_amount);
            cryptoAccount.total = Number(cryptoAccount.available) + Number(cryptoAccount.order) ;

            await cryptoAccount.save() ;
        }

        order.status = null ;
        await order.save() ;

        await BroadcastMarketInfo(order.crypto_id, order.pair_id) ;

        res.status(200).json({
            status : 'success'
        }) ;
    }

    async userOrderClear(req, res, next) {
        let order = await Orders.findOne({
            _id : req.body.id
        }) ;

        order.cleared = 1 ;
        await order.save() ;

        res.status(200).json({
            status : 'success'
        })
    }
}

export default new ExchangeController() ;