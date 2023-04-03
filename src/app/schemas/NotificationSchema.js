import { Schema , model } from "mongoose";
import mongoose from 'mongoose' ;

const NotificationSchema = new Schema({
    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    }
} , { timestamps: true }) ;

export default model('Notification' , NotificationSchema) ;