const credentials = process.env.MONGO_USERNAME ? 
                    `${process.env.MONGO_USERNAME}:${encodeURI(process.env.MONGO_PASSWORD)}@` : 
                    '';

const base = (process.env.SRV === 'true') ? 'mongodb+srv' : 'mongodb';
const end = (process.env.SRV === 'true') ? '?retryWrites=true&w=majority' : '';

export default {
    mongoUrl: ( host = process.env.MONGO_HOST ) => `${base}://${credentials}${host}/${process.env.MONGO_DATABASE}${end}`,
    config: {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        useCreateIndex: true
    },
};