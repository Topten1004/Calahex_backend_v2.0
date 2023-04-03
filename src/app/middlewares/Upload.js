import path from 'path';
import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "logo") {
            cb(null, './src/uploads/logos/')
        }
        else if (file.fieldname === "paper") {
            cb(null, './src/uploads/papers/');
        }
    },
    filename:(req, file, cb)=>{
        if (file.fieldname === "logo") {
            cb(null, file.fieldname + "-" + req.body.name + "-" + req.body.symbol + path.extname(file.originalname))
        }
        else if (file.fieldname === "paper") {
            cb(null,  file.fieldname + "-" + req.body.name + "-" + req.body.symbol + path.extname(file.originalname));
        }
    }
});

const checkFileType = (file, cb) => {
    if (file.fieldname === "paper") {
        if ( file.mimetype === 'application/pdf') { 
            cb(null, true);
        } else {
            cb(null, false); // else fails
        }
    }
    else if (file.fieldname === "logo") {
        if (    file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg' ||
                file.mimetype === 'image/jpeg'||
                file.mimetype==='image/gif' 
        ) { // check file type to be png, jpeg, or jpg
            cb(null, true);
        } else {
            cb(null, false); // else fails
        }
    }
}

const Upload = multer({
    storage: storage,
    limits: {
            fileSize: 1024 * 1024 * 10
        },
        fileFilter: (req, file, cb) => {
            checkFileType(file, cb);
        }
    }).fields(
    [
        {
            name:'logo',
            maxCount:1
        },
        {
            name: 'paper', 
            maxCount:1
        }
]);

export default Upload ;