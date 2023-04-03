
export const validateValue = async (schema, object) => {
    return schema.validate(object, { 
        abortEarly: false ,
    });
}

export const validateParams = async (limitParams , req , res) => {
    if(Object.keys(req.body).length > limitParams) {
        return false ;
    }
    return true ;
}

export const defaultResponse = async (res , error) => {
    console.log(error) ;
    return res.status(400).json({
                error : "Validation falis" ,
                message : "Validation Error."
            })
}