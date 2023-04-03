import { NowPayment, GetLimitAmount, CreatePayment } from '../../services/PaymentService';
import { WithdrawERC20Crypto, WithdrawEthereum } from '../../services/Web3Service';

import AppError from "../../utils/AppError";
import ControllerUtils from "../../utils/ControllerUtils";

import {
    Accounts,
    Cryptos,
    PayOrders,
    Wallets
} from '../../schemas' ;

class PaymentController extends ControllerUtils {
    constructor() {
        super() ;

        this.fiatDeposit = this.fiatDeposit.bind(this) ;
        this.cryptoWithdraw = this.cryptoWithdraw.bind(this) ;
        this.getLimitAmount = this.getLimitAmount.bind(this) ;
        this.createPayment = this.createPayment.bind(this) ;
    }

    async createPayment(req, res, next) {
        let payOrder = await PayOrders.store({
            user_id : req.user._id
        }) ;

        await payOrder.save() ;

        let response = null;

        if(req.body.type === 'deposit') {
            response = await CreatePayment(req.body.crypto.symbol, Number(req.body.amount), "CA1EX-CryptoDeposit-" + payOrder._id) ;
        }

        if(!response) {
            await PayOrders.delete({
                _id : payOrder._id
            }) ;

            return next(new AppError(403, 'createPayment', 'Now Payment Failed.')) ;
        }

        payOrder.crypto_id = req.body.crypto.crypto_id
        payOrder.payment_id = response.payment_id ;
        payOrder.unit = req.body.crypto.symbol === "USDTERC20" ? "USDT" : req.body.crypto.symbol ;
        payOrder.address = response.pay_address ;
        payOrder.reference = req.body.reference ;
        payOrder.payment_type = req.body.type ;
        payOrder.amount = Number(req.body.amount) ;

        await payOrder.save() ;
        
        return res.status(200).json({
            paymentInfo : response 
        });
    }
    
    async fiatDeposit(req, res, next) {

        let order = await PayOrders.store({
            ...req.body,
            user_id : req.user._id,
            payment_id : 0,
            reference : 'fiat',
            payment_type : 'deposit',
            status : 'requesting'
        })

        if(!order) return next(new AppError(403, 'fail', 'Fiat Deposit Failed.'), req, res, next) ;

        let invoice_url = await NowPayment(Number(req.body.amount), req.body.unit, req.user._id, order._id) ;

        if(!invoice_url) return next(new AppError(403, 'payment' , 'NowPayment Failed.'), req, res, next) ;

        res.status(200).json({
            invoice_url : invoice_url
        });
    }

    async cryptoWithdraw(req, res, next) {
        let crypto = await Cryptos.findOne({
            _id : req.body.crypto_id
        }) ;

        let payOrder = await PayOrders.store({
            user_id : req.user._id,
            reference : 'crypto',
            unit : crypto.symbol,
            payment_type : 'withdraw',
            address : req.body.toAccount,
            amount : Number(req.body.withdrawAmount),
            crypto_id : req.body.crypto_id
        }) ;

        payOrder.status = "pending" ;
        payOrder.payment_id = "CA1EX-CryptoWithdraw-" + payOrder._id ;
        await payOrder.save() ;

        let wallet = await Wallets.findOne({
            user_id : req.user._id
        });

        let account = await Accounts.findOne({
            wallet_id : wallet._id,
            crypto_id : req.body.crypto_id
        })

        if(account.available < Number(req.body.withdrawAmount)){
            payOrder.status = 'failed' ;
            await payOrder.save();
            return next(new AppError(403, 'cryptoWithdraw', 'Inffucient Funds.')) ;
        }
        
        let resultTx = false ;

        if(crypto.symbol === "ETH") {
            resultTx = await WithdrawEthereum(req.body.toAccount, req.body.withdrawAmount.toString()) ;
        } else {
            resultTx = await WithdrawERC20Crypto(crypto.address, crypto.symbol, req.body.withdrawAmount.toString(), req.body.toAccount) ;
        }

        if(!resultTx) {
            payOrder.status = "failed" ;
            await payOrder.save() ;
            return next(new AppError(403, "cryptoWithdraw", "Web3 Transaction Error.")) ;
        }

        account.available = Number(account.available) - Number(req.body.withdrawAmount) ;
        account.total = Number(account.available) + Number(account.order) ;
        await account.save() ;

        payOrder.status = "finished" ;
        await payOrder.save() ;

        return res.status(200).json({
            status : "success"
        });
    }

    async getLimitAmount(req, res, next) {
        let limitAmount = await GetLimitAmount(req.body.crypto, req.body.crypto) ;

        res.status(200).json({
            limitAmount : limitAmount
        })
    }
}

export default new PaymentController() ;