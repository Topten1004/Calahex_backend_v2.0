import AppError from "./AppError";

class ControllerUtils {
    constructor() {
        this.defaultHandler = this.defaultHandler.bind(this);
    }

    async defaultHandler(req, res, promise , next) {
        try {
            const data = await promise ;

            if(data){
                return res.status(200).json(data);
            } else {
                return res.status(204).send() ;
            }

        } catch(err) {
            next(err , req, res , next);
        }
    }
}

export default ControllerUtils ;