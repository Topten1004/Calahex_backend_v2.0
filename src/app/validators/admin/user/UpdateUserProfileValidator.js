import * as Yup from 'yup';
import { defaultResponse, validateValue , validateParams } from '../../../common/DefaultValidation';


export default async (req, res, next) => {
    try {
        
        let isValidateParams = false ;
        
        isValidateParams = await validateParams(9,req, res) ;
       
        if(!isValidateParams){
            return res
                .status(400)
                .json({
                    error : "Parameters failed" ,
                    message : "overflow parameters"
                })
        }
        
        let schema = Yup.object().shape({
            _id : Yup.string().required(),
            first_name: Yup.string().required(),
            last_name: Yup.string().required(),
            country : Yup.string().required(),
            city : Yup.string().required() ,
            street : Yup.string().required(),
            postal_code : Yup.string().required() ,
            birthday : Yup.date().required() ,
            language : Yup.string().required(),
        });
        
        await validateValue(schema, req.body);
        
        return next();

    } catch (error) {
        return defaultResponse(res, error);
    }
};