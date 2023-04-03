import * as Yup from 'yup';
import { defaultResponse, validateValue , validateParams } from '../../../common/DefaultValidation';


export default async (req, res, next) => {
    try {
        
        let isValidateParams = false ;
        
        isValidateParams = await validateParams(2,req, res) ;
       
        if(!isValidateParams){
            return res
                .status(400)
                .json({
                    error : "Parameters failed" ,
                    message : "overflow parameters"
                })
        }
        
        let schema = Yup.object().shape({
            title : Yup.string().required(),
            description : Yup.string().required()
        });
        
        await validateValue(schema, req.body);
        
        return next();

    } catch (error) {
        return defaultResponse(res, error);
    }
};