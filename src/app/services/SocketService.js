import {
    Orders,
    Notifications,
    Cryptos
} from '../schemas' ;

import { formatDBDate, numberToPlanString } from '../utils/Helper';

export const WeightedAverage = async (crypto_id, pair_id) => {
    let sum_total  = 0 ;
    let sum_amount = 0 ;

    let matchQuery = {
        $match : {
            crypto_id : crypto_id,
            pair_id : pair_id,
            status : 1
        }
    } ;

    let groupQuery  = {
        '$group' : {
            _id : null,
            sumAmount : {
                $sum : "$crypto_amount"
            },
            sumTotal : {
                $sum : "$pair_amount"
            }
        }
    } ;
   
    let aggregation = await Orders.aggregate(matchQuery , groupQuery ) ;

    if(aggregation) {
        sum_amount = aggregation.sumAmount ;
        sum_total =  aggregation.sumTotal ;
    }

    if(!sum_amount) {
        let crypto = await Cryptos.findOne({
            _id : crypto_id
        }) ;

        return crypto.initial_price[pair_id] ;
    }
    else return Number(sum_total) / Number(sum_amount) ;
}

export const CryptoOrderList = async (crypto_id, pair_id) => {

    let orders = await Orders.findAndSort({
        crypto_id : crypto_id,
        pair_id : pair_id,
        status : 0
    }, {
        price : -1
    });

    let orderSellList = [] ;

    let sell_sum_amount = 0;
    let sell_sum_total = 0 ;

    let sell_orders = orders.filter(list => list.type === 'sell').reverse() ;
    
    await Promise.all(sell_orders.map((sell_order, index) => {
        sell_sum_amount += Number(sell_order.crypto_amount) ;
        sell_sum_total += Number(sell_order.price) * Number(sell_order.crypto_amount) ;

        let sell_avg_price = sell_sum_total / sell_sum_amount ;

        orderSellList.push({
            orderer_id : sell_order._id,
            price : sell_order.price,
            amount : sell_order.crypto_amount,
            total : Number(sell_order.price) * Number(sell_order.crypto_amount) ,
            avg_price : numberToPlanString(sell_avg_price) ,
            sum_amount : sell_sum_amount,
            sum_total : sell_sum_total 
        })
    }));

    let orderBuyList = [] ;

    let buy_sum_amount = 0;
    let buy_sum_total = 0 ;

    let buy_orders = orders.filter(list => list.type === 'buy') ;

    await Promise.all(buy_orders.map((buy_order, index) => {
        buy_sum_amount += Number(buy_order.crypto_amount) ;
        buy_sum_total += Number(buy_order.price) * Number(buy_order.crypto_amount) ;

        let buy_avg_price = buy_sum_total / buy_sum_amount ;

        orderBuyList.push({
            orderer_id : buy_order._id,
            price : buy_order.price,
            amount : buy_order.crypto_amount,
            total : Number(buy_order.price) * Number(buy_order.crypto_amount) ,
            avg_price : numberToPlanString(buy_avg_price) ,
            sum_amount : buy_sum_amount,
            sum_total : buy_sum_total 
        })
    })) ;

    return {
        orderSellList : orderSellList.reverse(),
        orderBuyList : orderBuyList
    };
}

export const MarketTradeList = async (crypto_id, pair_id) => {

    let marketTradeList = [] ;

    let orders = await Orders.findAndSort({
        crypto_id : crypto_id,
        pair_id : pair_id,
        status : 1
    }, {
        updatedAt : -1
    }) ;

    for(let order of orders) {
        marketTradeList.push({
            type : order.type,
            price : order.price,
            time : formatDBDate(order.updatedAt, "time") ,
            amount : order.crypto_amount ,
            total : Number(order.price) * Number(order.crypto_amount)
        })
    }

    return marketTradeList ;
}

export const CryptoPairList = async () => {
    let cryptos = await Cryptos.find({}) ;

    let cryptoPairList = {} ;

    for(let crypto of cryptos) {
        for(let pair_id of crypto.pair) {
            let pair = await Cryptos.findOne({
                _id : pair_id
            }) ;

            let high = 0 ;
            let low = 0 ;
            let percent = 0 ;
            let quoteVolume = 0 ;
            let baseVolume = 0 ;
    
            let orders = await Orders.findAndSort({
                crypto_id : crypto._id,
                pair_id : pair._id,
                status : 1
            }, {
                price : 1
            }) ;
    
            if(orders.length) {
                high = orders[orders.length - 1].price ;
                low = orders[0].price ;
                percent = (high - low) / low * 100 ;
            }
    
            let matchQuery = {
                $match : {
                    crypto_id : crypto._id,
                    pair_id : pair._id,
                    status : 1
                }
            } ;
    
            let groupQuery  = {
                '$group' : {
                    _id : null,
                    sumAmount : {
                        $sum : "$crypto_amount"
                    },
                    sumTotal : {
                        $sum : "$pair_amount"
                    }
                }
            } ;
           
            let aggregation = await Orders.aggregate(matchQuery , groupQuery ) ;
    
            if(aggregation) {
                baseVolume = aggregation.sumTotal ;
                quoteVolume = aggregation.sumAmount ;
            }
    
            let price = await WeightedAverage(crypto._id, pair._id) ;
    
            if(!price) price = crypto.initial_price[pair._id] ;
    
            cryptoPairList[crypto._id+"-"+pair._id] = {
                name : crypto.symbol+"_"+pair.symbol ,
                crypto : {
                    id : crypto._id,
                    name : crypto.name,
                    symbol : crypto.symbol,
                    is_deposit : crypto.is_deposit_coin
                },
                pair : {
                    id : pair._id,
                    symbol : pair.symbol,
                    is_deposit : pair.is_deposit_coin
                },
                transaction_fee : crypto.transaction_fee ,
                price : price,
                high : high,
                low : low,
                baseVolume : baseVolume,
                quoteVolume : quoteVolume,
                percent : percent
            }
        }
    }
    return cryptoPairList ;
}

export const AllNotifications = async () => {
    let notificationList = [] ;

    let notifications = await Notifications.find({}) ;

    for(let notification of notifications){
        notificationList.push({
            title : notification.title,
            description : notification.description,
            createdAt : formatDBDate(notification.createdAt , "datetime"),
            updatedAt : formatDBDate(notification.updatedAt, "datetime")
        }) ;
    }

    return notificationList ;
}

export const BroadcastMarketInfo = async (crypto_id, pair_id) => {

    let cryptoPairList = await CryptoPairList() ;

    global.io.emit("Response: Crypto Pair List" , cryptoPairList) ;

    let cryptoOrderList = await CryptoOrderList(crypto_id, pair_id) ;

    global.io.emit(`Response: Crypto Order List(${crypto_id}, ${pair_id})`, cryptoOrderList) ;

    let marketTradeList = await MarketTradeList(crypto_id, pair_id) ;

    global.io.emit(`Response: Market Trade List(${crypto_id}, ${pair_id})`, marketTradeList) ;
}