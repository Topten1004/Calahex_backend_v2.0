import fs from 'fs' ;
import { create, all } from 'mathjs' ;

const math = create(all, {}) ;

export const formatDBDate = (db_datetime , cond) => {
    if(typeof db_datetime === "undefined") return ;

    db_datetime = db_datetime.toISOString() ;

    let removeT_db_datetime = db_datetime.replace("T" , " ") ;
    
    let removeTail_db_datetime = removeT_db_datetime.split(".")[0] ;

    if(cond === "datetime") {
        return removeTail_db_datetime ;
    }
    if(cond === "date") {
        let to_date = removeTail_db_datetime.split(" ")[0] ;

        return to_date ;
    }
    if(cond === "time") {
        let to_time = removeTail_db_datetime.split(" ")[1] ;

        return to_time ;
    }
}

export const numberToPlanString = (number) => {
    return math.format(number, { notation : 'fixed' } ) ;
}

export const isset = (variable) => {
    if(typeof variable === "undefined") return false ;

    return true ;
}

export const delUploadedFile = async (path) => {
    const __dirname = "./src/uploads/" ;
    
    await fs.unlink(__dirname+ path , function (err) {            
        if (err) {                                                 

        }                                                          
    }); 
}