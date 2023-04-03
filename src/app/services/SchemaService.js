class SchemaService {

    constructor(Schema) {

        this.schema = Schema ;

        this.store = this.store.bind(this) ;

        this.findOne = this.findOne.bind(this) ;
        this.find = this.find.bind(this) ;
        this.findAndSort = this.findAndSort.bind(this) ;
        this.findOneAndUpdate = this.findOneAndUpdate.bind(this) ;

        this.hasOne = this.hasOne.bind(this);
        this.hasAll = this.hasAll.bind(this) ;
        
        this.delete = this.delete.bind(this);
        this.deleteAll = this.deleteAll.bind(this) ;

        this.aggregate = this.aggregate.bind(this) ;
    }

    async store( query ) {
        try {
            const doc = await this.schema.create(query) ;
            
            return doc ;
        } catch(err) {
            console.log(err);
            return false ;
        }
    }

    async findOne( query ) {
        try {
            const doc = await this.schema.findOne(query) ;

            return doc ;
        }
        catch(err) {
            return false ;
        }
    }
    async find( query ) {
        try {
            const doc = await this.schema.find(query) ;

            return doc ;
        } catch(err) {
            console.log(err);
            return false ;
        }
    }
    async findAndSort ( query, sort ) {
        try {
            const doc = await this.schema.find(query).sort(sort) ;

            return doc ;
        } catch (err) {
            return false ;
        }
    }
    async findOneAndUpdate(query, update) {
        try {
            const doc = await this.schema.findOneAndUpdate(
                query,
                update,
                {
                    new: true,
                    runValidators: true
                }
            ) ;

            return doc ;
        } catch(err) {
            console.log(err) ;
            return false ;
        }
    }
    async hasOne( query , foreign_key) {
        try {
            const doc  = await this.schema.findOne(query).populate(foreign_key) ;

            return doc ;
        } catch (err) {
            console.log(err) ;
            return false ;
        }
    }
    async hasAll( query , foreign_key) {
        try {
            const doc  = await this.schema.find(query).populate(foreign_key) ;

            return doc ;
        } catch (err) {
            console.log(err) ;
            return false ;
        }
    }

    async delete(query) {
        try {
            const doc = await this.schema.deleteMany(query) ;

            console.log(doc) ;
            return true ;
        } catch(err) {
            console.log(err) ;
            return false ;
        }
    }

    async aggregate(matchQuery, groupQuery) {
        try {
            const doc = await this.schema.aggregate([matchQuery, groupQuery]) ;

            if(doc.length) return doc[0] ;
            return null ;
        } catch(err) {
            console.log(err) ;

            return null ;
        }
    }
    async deleteAll(data, query) {
        try {
            const result = await this.schema.findByIdAndUpdate(data._id , query) ;

            console.log("deleteAll------------------", result)
            // await this.schema.deleteOne(data) ;

            return true ;
        } catch(err) {
            console.log(err) ;

            return false ;
        }
    }

    async save(doc, query) {
        
    }
}

export default SchemaService ;