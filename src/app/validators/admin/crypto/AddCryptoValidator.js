import * as Yup from 'yup';
import { defaultResponse, validateValue , validateParams } from '../../../common/DefaultValidation';
import AppError from '../../../utils/AppError';

import validator from 'validator' ;
import { isset } from '../../../utils/Helper';

export default async (req, res, next) => {
    try {
        
        if(isset(req.body.address)) {
            if(!validator.isEthereumAddress(req.body.address)) {
                return next(400, 'crypto address', 'Crypto address is not invalid') ;
            }
        }

        const schema = Yup.object().shape({
            name: Yup.string().required(),
            symbol: Yup.string().required(),
            decimal : Yup.number().required(),
            pair_list : Yup.string().required(),
            withdraw_fee : Yup.string().required(),
            deposit_fee : Yup.number().required(),
            transfer_fee : Yup.number().required(),
            transaction_fee : Yup.number().required(),
        });

        if( 
            Number(req.body.deposit_fee) < 0 || 
            Number(req.body.transaction_fee) < 0 || 
            Number(req.body.transfer_fee) < 0 || 
            Number(req.body.withdraw_fee) < 0
        ) {
            return next(new AppError(400, 'fee', 'Fee is invalid')) ;
        }

        if(!Array.isArray(JSON.parse(req.body.pair_list))) {
            return next(new AppError(400, 'pair list', 'Pair list is invalid'))
        } 

        let is_exist_logo = false ;
        let is_exist_paper = false ;

        for(let [key, value] of Object.entries(req.files)){
            if(value[0].fieldname === 'logo'){
                is_exist_logo = true;
                if (    value[0].mimetype !== 'image/png'  &&
                        value[0].mimetype !== 'image/jpg'  &&
                        value[0].mimetype !== 'image/jpeg' &&
                        value[0].mimetype !=='image/gif' 
                ){
                    new AppError((400 , 'logo' , 'Logo image is not image type.'), req, res, next);
                }
            }
            if(value[0].fieldname === 'paper'){
                is_exist_paper = true ;
                if (    value[0].mimetype !== 'application/pdf' ){
                    return next(new AppError(400 , 'whitepaper' , 'Whitepaper is not pdf type.'), req, res, next);
                }
            }
        }

        if(!is_exist_logo || !is_exist_paper){
            return next(new AppError(400 , 'logo or whitepaper' , 'Logo or Whitepaper is not uploaded.'), req, res, next);
        }

        await validateValue(schema, req.body);
        
        return next();

    } catch (error) {
        return defaultResponse(res, error);
    }
};