import * as Yup from 'yup';
import { defaultResponse, validateValue , validateParams } from '../../../common/DefaultValidation';


export default async (req, res, next) => {
    try {
        
        const isValidateParams = await validateParams(2 , req , res) ;

        if(!isValidateParams){
            return res
                .status(403)
                .json({
                    error : "Parameters failed" ,
                    message : "overflow parameters"
                })
        }
        
        const schema = Yup.object().shape({
            email: Yup.string().required(),
            password: Yup.string().min(8).required(),
        });

        await validateValue(schema, req.body);
        
        return next();

    } catch (error) {
        return defaultResponse(res, error);
    }
};