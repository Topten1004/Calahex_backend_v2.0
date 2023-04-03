
import axios from "axios";
import apiConfig from '../static/Constant' ;
import { isset } from "../utils/Helper";

export const CurrencyRates = async (symbol) => {
    try {
        let res = await axios.get(`${apiConfig.PUBLIC_COINBASE_API}exchange-rates?currency=${symbol}`) ;

        return res.data.data.rates ;
    } catch(err) {
        return false ;
    }
}
export const CurrencyList = async () => {
    try {
        let res = await axios.get(`${apiConfig.PUBLIC_POLONIEX_API}command=returnCurrencies`) ;

        return res.data ;
    } catch(err) {
        return false ;
    }
}

export const PairInfoList = async () => {
    try {
        let res = await axios.get(`${apiConfig.PUBLIC_POLONIEX_API}command=returnTicker`) ;

        return res.data ;
    } catch(err) {
        return false ;
    }
}

export const OrderList = async (pair) => {
    try {
        let res = await axios.get(`${apiConfig.PUBLIC_POLONIEX_API}command=returnOrderBook&currencyPair=${pair}&depth=50`) ;

        
        if(isset(res.data.error)) return false ;

        return res.data ;
    } catch(err) {
        console.log(err) ;
        return false ;
    }
}

export const MarketTradeHistory = async (pair) => {
    try {
        let res = await axios.get(`${apiConfig.PUBLIC_POLONIEX_API}currencyPair=${pair}&command=returnTradeHistory`) ;

        if(isset( res.data.error)) return false ;
        return res.data ;
    } catch(err) {
        console.log(err);
        return false ;
    }
} 

