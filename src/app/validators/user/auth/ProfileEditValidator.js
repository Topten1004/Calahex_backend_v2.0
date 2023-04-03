import * as Yup from 'yup';
import { defaultResponse, validateValue , validateParams } from '../../../common/DefaultValidation';

export default async (req, res, next) => {
    try {
        
        let isValidateParams = false ;
        
        if(!req.body.is_enable_fa) {
            isValidateParams = await validateParams(10,req, res) ;
        } else {
            isValidateParams = await validateParams(15, req, res) ;
        }

        if(!isValidateParams){
            return res
                .status(400)
                .json({
                    error : "Parameters failed" ,
                    message : "overflow parameters"
                })
        }
        
        let schema ;
        
        if(!req.body.is_enable_fa) {
            schema = Yup.object().shape({
                first_name: Yup.string().required(),
                last_name: Yup.string().required(),
                country : Yup.string().required(),
                city : Yup.string().required() ,
                street : Yup.string().required(),
                postal_code : Yup.string().required() ,
                birthday : Yup.date().required() ,
                language : Yup.string().required(),
                is_enable_fa : Yup.boolean().required(),
                _id : Yup.string().required()
            });
        } else {
            schema = Yup.object().shape({
                first_name: Yup.string().required(),
                last_name: Yup.string().required(),
                country : Yup.string().required(),
                city : Yup.string().required() ,
                street : Yup.string().required(),
                postal_code : Yup.string().required() ,
                birthday : Yup.date().required() ,
                language : Yup.string().required(),
                is_enable_fa : Yup.boolean().required(),
                _id : Yup.string().required(),
                nick_name : Yup.string().required() ,
                mother_name : Yup.string().required(),
                father_name : Yup.string().required(),
                hobby : Yup.string().required(),
                best_friend : Yup.string().required()
            });
        }
        

        await validateValue(schema, req.body);
        
        return next();

    } catch (error) {
        return defaultResponse(res, error);
    }
};