require('dotenv').config();
const MongoClient = require("mongodb").MongoClient;

const { User, JoinReqData } = require('../types/users')

let mongoClient: any;
let db: any;
let collection: any;
let joinCollection: any;
const url = process.env.MONGO_URL;
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASS;
const authMechanism = "DEFAULT";
const uri =`mongodb://${username}:${password}@${url}/?authMechanism=${authMechanism}`;

console.log('hello')

class mongoFunc {
    constructor() {
        mongoClient = new MongoClient(uri);
        db = mongoClient.db("gf");
        collection = db.collection("gfUsers");
        joinCollection = db.collection("gfJoinUsers");
    }

    async find(obj: any) {
        let extBuf:any[] = [];
        try {
            await mongoClient.connect();
            if (obj) {
                extBuf = await collection.find(obj).toArray();
            }
            else {
                extBuf = await collection.find().toArray();
            }
        }catch(err) {
            extBuf=[];
        } finally {
            await mongoClient.close();
            return extBuf;
        }
    }

    async incertOne(obj: any, join?: boolean) {
        try {
            await mongoClient.connect();
            join===true ? await joinCollection.insertOne(obj) : await collection.insertOne(obj);
        }catch(err) {
            console.log(err)
        } finally {
            await mongoClient.close();
        }
    }

    async id(join?: boolean) {
        try {
            await mongoClient.connect();
            const count = join===true ? await joinCollection.countDocuments() : await collection.countDocuments();
            await mongoClient.close();
            console.log('Записей: ' + count)
            return count
        }
        catch(e) {
            console.log(e);
            await mongoClient.close();
        }
    }

    async updateOne(oldObj:any , obj: any, join?: boolean) {
        let userLogin;
        try {
            await mongoClient.connect();
            userLogin = join===true ? 
                await joinCollection.updateOne(oldObj, {$set: obj}) : 
                await collection.updateOne(oldObj, {$set: obj});
        }catch(err) {
            console.log(err)
        } finally {
            await mongoClient.close();
            return userLogin
        }
    }

    async deleteOne(obj: any, join?: boolean) {
        let userLogin;
        try {
            await mongoClient.connect();
            userLogin = join===true ? 
                await joinCollection.deleteOne(obj) : 
                await collection.deleteOne(obj);
        }catch(err) {
            console.log(err)
        } finally {
            await mongoClient.close();
            return userLogin
        }
    }
}

module.exports = mongoFunc;