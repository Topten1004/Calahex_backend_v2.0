import mongoose from 'mongoose';

import mongoConfig from './configs/mongoConfig';

class Database {

    constructor() {
        this.mongo();
    }

    async mongo() {
   
        if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
            this.mongoConnection =  process.env.NODE_ENV !== 'test' ?
                                    await mongoose.connect(mongoConfig.mongoUrl()): // remove mongoConfig.config in Mongoose 6.0
                                    await mongoose.connect(process.env.MONGO_URL);
            
        }

        return this.mongoConnection;
  }
}

export default new Database();