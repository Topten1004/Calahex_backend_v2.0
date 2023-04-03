import nodemailer from 'nodemailer' ;
import crypto from 'crypto' ;
import mailerConfig from '../../configs/mailerConfig' ;

let transporter = nodemailer.createTransport(mailerConfig);

export default async (toEmail , callback) => {

    let code =  crypto.randomBytes(20).toString('hex') ;

    console.log(toEmail , mailerConfig.auth.user) ;

    let mailOptions = {
        from: mailerConfig.auth.user,
        to: toEmail,
        subject: 'CA1EX.com Email Confirmation',
        html : `<body><h1>CA1EX.com Email Confirmation</h1>` + `<p> Confirm Code: ` + code + `</p></body>`
    };
    
    console.log(mailOptions) ;

    transporter.verify((err, success) => {
        if (err) {
            return console.error(err);
        }
        transporter.sendMail(mailOptions, function (error) {
            // if(error){
            //     console.log(error);
            // }
    
            // in build
            if(error) {
                console.log(error) ;
                return callback(null);
            }
            
            return callback(code);
        });
    });

    
}
