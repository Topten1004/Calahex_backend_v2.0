import * as Yup from 'yup';
import { defaultResponse, validateValue , validateParams } from '../../../common/DefaultValidation';
import AppError from '../../../utils/AppError';


export default async (req, res, next) => {
    try {
        
        const isValidateParams = await validateParams(6 , req , res) ;

        if(!isValidateParams){
            return res
                .status(400)
                .json({
                    error : "Parameters Invalid" ,
                    message : "Overflow Parameters"
                })
        }

        const schema = Yup.object().shape({
            price : Yup.string().required(),
            crypto_id : Yup.string().required(),
            crypto_amount : Yup.number().required(),
            pair_id : Yup.string().required(),
            pair_amount : Yup.number().required()  ,
            method : Yup.string().required()
        });

        await validateValue(schema, req.body);
        
        if(Number(req.body.crypto_amount) <= 0 || Number(req.body.pair_amount) <= 0 || Number(req.body.price) <= 0) {
            return next(new AppError(400, 'Parameters Invalid', 'Invalid Amount')) ;
        }

        return next();

    } catch (error) {
        return defaultResponse(res, error);
    }
};