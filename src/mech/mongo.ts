require('dotenv').config();
const MongoClient = require("mongodb").MongoClient;

const { User, JoinReqData } = require('../types/users')

let mongoClient: any;
let db: any;
let collection: any;
let joinCollection: any;
let goldCollection: any;
let goldTotalCollection: any;
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
        goldCollection = db.collection("gfGold");
        goldTotalCollection = db.collection("gfGoldTotal");
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

    async goldTotal(login: string, usLogin?: string) {
        let goldData;
        try {
            let extBuf: any[];
            await mongoClient.connect();
            extBuf = await collection.find({login: login}).toArray();
            console.log(extBuf)
            if (extBuf.length) {
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer')) {
                    if (usLogin) {
                        const result = await goldCollection.find({login: usLogin}).toArray()
                        goldData = {res: 'ok', data: { total: result[0].total || 0, history: result[0].history || []}}
                    }
                    else {
                        const result = await goldTotalCollection.find().toArray()
                        if (result.length) goldData = {res: 'ok', data: { total: result[0].total || 0, history: result[0].history || []}}
                        else goldData = {res: 'noData'}
                    }
                } 
                else goldData = {res: 'not auth'}
            }
            else goldData = {res: 'not auth'};
        }catch(err) {
            goldData = {res: 'err'};
            console.log(err)
        } finally {
            await mongoClient.close();
            return goldData;
        }
    }

    async newGoldValue(obj: {login: string, value: number, date: number, veryfi: string}, auth: string) {
        let res: boolean = false;
        try {
            await mongoClient.connect();
            let extBuf: any[] = await collection.find({login: auth}).toArray();
            if (extBuf.length) {
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer')) {
                    const result = await goldTotalCollection.find().toArray()
                    if (result.length === 0) await goldTotalCollection.insertOne({total: obj.value, history: [obj], id: 'total'})
                    else {
                        result[0].history.push(obj);
                        let newVal = {total: result[0].total + obj.value, history: result[0].history}
                        await goldTotalCollection.updateOne({id: 'total'}, {$set: newVal})
                    }
                    const personalRes = await goldCollection.find({login: obj.login}).toArray();
                    if (personalRes.length === 0 ) {
                        await goldCollection.insertOne({login: obj.login, total: obj.value, history: [obj], sale: 0, status: 0})
                        await collection.updateOne({login: obj.login}, {$set: {gold: obj.value}});
                    }
                    else {
                        personalRes[0].history.push(obj)
                        let newVal = {total: personalRes[0].total + obj.value, history: personalRes[0].history}
                        await goldCollection.updateOne({login: obj.login}, {$set: newVal})
                        await collection.updateOne({login: obj.login}, {$set: {gold: newVal.total}});
                    }
                    res = true;
                } 
            }
        }catch(err) {
            console.log(err)
        } finally {
            await mongoClient.close();
            return res;
        }
    }

    async updatePersonalValue(obj: {login: string, value: number, date: number}, auth: string) {
        let res: boolean = false;
        console.log(1)
        try {
            await mongoClient.connect();
            let extBuf: any[] = await collection.find({login: auth}).toArray();
            console.log(2)
            if (extBuf.length) {
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer')) {
                    console.log(3)
                    const result = await goldTotalCollection.find().toArray()
                    if (result.length !== 0) {
                        let newTotalValue: number = 0;
                        let correctedValue: number = -1;
                        console.log(4)
                        for (let i = 0; i < result[0].history.length; i++ ) {
                            if ((result[0].history[i].login === obj.login) && (result[0].history[i].date === obj.date)) {
                                correctedValue = i; 
                            }
                            newTotalValue += result[0].history[i].value;
                        }
                        console.log(5)
                        if (correctedValue>-1) { 
                            console.log(5.1)                 
                            if (obj.value === 0 ) {
                                console.log(5.2) 
                                newTotalValue -= result[0].history[correctedValue].value;
                                result[0].history.slice(correctedValue, 1);
                            }
                            else {
                                console.log(5.3) 
                                newTotalValue += (obj.value - result[0].history[correctedValue].value);
                                result[0].history[correctedValue] = {...obj}
                            }
                        }
                        console.log(6)
                        await goldTotalCollection.updateOne({id: 'total'}, {$set: {total: newTotalValue, history: result[0].history}});
                    }
                    console.log(7)
                    const personalRes = await goldCollection.find({login: obj.login}).toArray();
                    if (personalRes.length === 0 ) await goldCollection.insertOne({login: obj.login, total: obj.value, history: [obj], sale: 0, status: 0})
                    else {
                        console.log(8)
                        let newPersonalValue: number = 0;
                        let correctedValue: number = -1;
                        for (let i: number = 0; i < personalRes[0].history.length; i++) {
                            newPersonalValue += personalRes[0].history[i].value;
                            if ((personalRes[0].history[i].date === obj.date) && (personalRes[0].history[i].login === obj.login)) {
                                correctedValue = i;
                            }
                        }
                        console.log(9)
                        if (correctedValue > -1) {
                            if (obj.value === 0) {
                                newPersonalValue -= personalRes[0].history[correctedValue].value;
                                personalRes[0].history.slice(correctedValue, 0)
                            }
                            else {
                                newPersonalValue -= (personalRes[0].history[correctedValue].value - obj.value);
                                personalRes[0].history[correctedValue] = {...obj};
                            }
                            await goldCollection.updateOne({login: obj.login}, {$set: {total: newPersonalValue, history: personalRes[0].history}});
                            await collection.updateOne({login: obj.login}, {$set: {gold: newPersonalValue}});
                        }
                    }
                    res = true;
                } 
            }
        }catch(err) {
            console.log(err)
        } finally {
            await mongoClient.close();
            return res;
        }
    }

    async updSaleStatus(obj: {login: string, sale: number, status: number}, auth: string) {
        let res: boolean = true;
        try {
            await mongoClient.connect();
            let extBuf: any[] = await collection.find({login: auth}).toArray();
            if (extBuf.length) {
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer')) {
                    await goldCollection.updateOne({login: obj.login}, {$set: {sale: obj.sale, status: obj.status}})
                    res = true;
                }
            }
            
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
            return res;
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