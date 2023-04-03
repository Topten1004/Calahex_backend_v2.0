import * as Yup from 'yup';
import { defaultResponse, validateValue , validateParams } from '../../../common/DefaultValidation';
import AppError from '../../../utils/AppError';


export default async (req, res, next) => {
    try {
        
        const schema = Yup.object().shape({
            crypto_id: Yup.string().required(),
            pair_id : Yup.string().required(),
            convert_amount : Yup.number().required()
        });

        
        await validateValue(schema, req.body);
        
        if(Number(req.body.convert_amount) <= 0) {
            return next(new AppError(400, 'convertCrypto' , 'Convert crypto amount is invalid')) ;
        }
        
        return next();

    } catch (error) {
        return defaultResponse(res, error);
    }
};