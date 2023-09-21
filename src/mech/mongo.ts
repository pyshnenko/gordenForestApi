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
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer') || (extBuf[0].login === usLogin)) {
                    if (usLogin) {
                        const result = await goldCollection.find({login: usLogin}).toArray()
                        goldData = {res: 'ok', data: { ...result[0]}}
                    }
                    else {
                        const result = await goldCollection.find({login: '123total'}).toArray()
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

    async goldTable(login: string, usLogin?: string, treasury?: boolean) {
        let goldData;
        try {
            let extBuf: any[];
            await mongoClient.connect();
            extBuf = await collection.find({login: login}).toArray();
            console.log(extBuf)
            if (extBuf.length) {
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer')) {
                    if (usLogin) {
                        const result = treasury ?
                            await goldTotalCollection.find({login: usLogin}).toArray():
                            await goldCollection.find({login: usLogin}).toArray();
                        goldData = {res: 'ok', data: { ...result[0]}}
                    }
                    else {
                        const result = await goldCollection.find().toArray();
                        let resArr: {login: string, value: any}[] = [];
                        await result.map((item: any)=>{if (item.login!=='123total') resArr.push({login: item.login, value: item.total})});
                        goldData = {res: 'ok', data: resArr}
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

    async newGoldValue(obj: {login: string, value: number, date: number, veryfi: string}, auth: string, treasury?: boolean) {
        let res: boolean = false;
        try {
            await mongoClient.connect();
            let extBuf: any[] = await collection.find({login: auth}).toArray();
            if (extBuf.length) {
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer')) {
                    const result = treasury ?
                        await goldTotalCollection.find({login: '123total'}).toArray():
                        await goldCollection.find({login: '123total'}).toArray();
                    console.log(result);
                    if (result.length === 0) treasury ?
                        await goldTotalCollection.insertOne({login: '123total', total: obj.value, history: [obj], sale: 0, status: 0}):
                        await goldCollection.insertOne({login: '123total', total: obj.value, history: [obj], sale: 0, status: 0})
                    else {
                        result[0].history.push(obj);
                        let newVal = {total: result[0].total + obj.value, history: result[0].history};
                        treasury ?
                            await goldCollection.updateOne({login: '123total'}, {$set: newVal}):
                            await goldTotalCollection.updateOne({login: '123total'}, {$set: newVal});
                    }
                    const personalRes = await goldCollection.find({login: obj.login}).toArray();
                    if (personalRes.length === 0 ) {
                        if (treasury)
                            await goldTotalCollection.insertOne({login: obj.login, total: obj.value, history: [obj], sale: 0, status: 0})
                        else {
                            await goldCollection.insertOne({login: obj.login, total: obj.value, history: [obj], sale: 0, status: 0})
                            await collection.updateOne({login: obj.login}, {$set: {gold: obj.value}})
                        }
                    }
                    else {
                        personalRes[0].history.push(obj)
                        let newVal = {total: personalRes[0].total + obj.value, history: personalRes[0].history}
                        if (treasury)
                            await goldTotalCollection.updateOne({login: obj.login}, {$set: newVal})
                        else {
                            await goldCollection.updateOne({login: obj.login}, {$set: newVal})
                            await collection.updateOne({login: obj.login}, {$set: {gold: newVal.total}});
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

    async updatePersonalValue(obj: {login: string, value: number, date: number}, auth: string, treasury?: boolean ) {
        let res: {done: boolean, total: number, comment?: string} = {done: false, total: 0};
        console.log(1)
        try {
            await mongoClient.connect();
            let extBuf: any[] = await collection.find({login: auth}).toArray();
            console.log(2)
            if (extBuf.length) {
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer')) {
                    console.log(3);
                    let result: any[] = treasury ?
                        await goldTotalCollection.find(obj.login):
                        await goldCollection.find(obj.login);
                    if (result.length>0) {
                        if (Array.isArray(result[0].history)) {
                            for (let i = 0; i<result[0].history.length; i++) {
                                if ((result[0].history[i].login === obj.login) && (result[0].history[i].date === obj.date)) {
                                    result[0].history[i].value = obj.value;
                                    result[0].history[i].upd = Number(new Date());
                                    result[0].history[i].updBy = extBuf[0].login;
                                    res.done = true;
                                    res.total += result[0].history[i].value;
                                    break;
                                }
                            }
                            treasury ?
                                await goldTotalCollection.updateOne({login: obj.login}, {$set: {total: res.total, history: result[0].history}}):
                                await goldCollection.updateOne({login: obj.login}, {$set: {total: res.total, history: result[0].history}});
                        }
                        else res.comment = 'no history';
                    }
                    else res.comment = 'no user';
                }
                else res.comment = 'no debt';
            }
            else res.comment = 'not auth';
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