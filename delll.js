require('dotenv').config();
const url = process.env.MONGO_URL;
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASS;
const authMechanism = "DEFAULT";
const uri =`mongodb://${username}:${password}@${url}/?authMechanism=${authMechanism}`;
const MongoClient = require("mongodb").MongoClient;
let mongoClient;
let db;
let collection;
mongoClient = new MongoClient(uri);
db = mongoClient.db("gf");
collection = db.collection("gfUsers");

console.log('hello');

start();

async function start() {

    if ((process.argv[2]==='-dUs')&&(process.argv[3])) {
        await deleteOne(process.argv[3]);
    }

    else if ((process.argv[2]==='-aUs')&&(process.argv[3])) {
        console.log(await findOne({login: process.argv[3]}))
    }

    else if ((process.argv[2]==='-u')) {
        console.log( await usList());
    }

    else console.log('-dUs <login> - удалить одного\n-aUs <login> - информация\n-u - Список пользователей')
}

async function usList() {
    //console.log('del');
    let extBuf = [];
    try {
        await mongoClient.connect();
        extBuf = await collection.find().toArray();
    }catch(err) {
        console.log(err);
    } finally {
        await mongoClient.close();
        return extBuf;
    }

}

async function deleteOne(login) {
    //console.log('del');
    let extBuf = [];
    try {
        await mongoClient.connect();
        console.log(await collection.findOneAndDelete({login: login}));
    }catch(err) {
        console.log(err);
    } finally {
        await mongoClient.close();
    }

}

async function updateOne(oldObj, obj) {
    //console.log('upd');
    let userLogin;
    try {
        await mongoClient.connect();
        userLogin = await collection.updateOne(
            oldObj, 
            {$set: obj});
    }catch(err) {
        console.log(err);
    } finally {
        await mongoClient.close();
        return userLogin
    }
}

async function findOne(obj) {
    let extBuf = [];
    try {
        await mongoClient.connect();
        if (obj) {
            extBuf = await collection.find(obj).toArray();
        }
        else {
            extBuf = await collection.find().toArray();
        }
    }catch(err) {
        logger.error('not find')
        extBuf=[];
    } finally {
        await mongoClient.close();
        return extBuf;
    }
}