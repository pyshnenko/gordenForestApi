require('dotenv').config();
const MongoClient = require("mongodb").MongoClient;

const { User, JoinReqData } = require('../types/users')

let mongoClient: any;
let db: any;
let collection: any;
let joinCollection: any;
let goldCollection: any;
let goldTotalCollection: any;
let eventsCollection: any;
const url = process.env.MONGO_URL;
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASS;
const authMechanism = "DEFAULT";
const uri =`mongodb://${username}:${password}@${url}/?authMechanism=${authMechanism}`;

export interface Event {
    pict: string[],
    text: string,
    fulltext: string,
    id?: number, 
    name: string,
    gold: number,
    activeMembers: string[],
    orginizer: string[],
    nowGold?: number,
    date: number,
    type: string
}

console.log('hello')

class mongoFunc {
    constructor() {
        mongoClient = new MongoClient(uri);
        db = mongoClient.db("gf");
        collection = db.collection("gfUsers");
        joinCollection = db.collection("gfJoinUsers");
        goldCollection = db.collection("gfGold");
        goldTotalCollection = db.collection("gfGoldTotal");
        eventsCollection = db.collection("gfEvents");
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

    async eventsAdd(login: string, event: Event) {
        let id: number = 0;
        console.log('mongo');
        try {
            await mongoClient.connect();
            console.log(login);
            let author: any[] = await collection.find({login}).toArray();
            console.log(author);
            if (author.length && (author[0].role === 'Lord' || author[0].role === 'Secretary')) {
                console.log('im here')
                let all: any[] = await eventsCollection.find().toArray();
                id = all.length === 0 ? 1 : all[all.length-1].id + 1;
                await eventsCollection.insertOne({...event, id, nowGold: 0})
            }
        }
        catch (e) {
            id = -1;
        }
        finally {
            await mongoClient.close();
            return id
        }
    }

    async eventslist(id: number) {
        let all: any[] = [];
        try {
            await mongoClient.connect();
            all = (id ? await eventsCollection.find({id}).toArray() : await eventsCollection.find().toArray());
        }
        catch (e) {
            all = [];
        }
        finally {
            await mongoClient.close();
            return all
        }
    }

    async eventsUpd(login: string, event: Event) {
        let res: boolean = false;
        try {
            await mongoClient.connect();
            let author: any[] = await collection.find({login}).toArray();
            if (author.length && (author[0].role === 'Lord' || author[0].role === 'Secretary')) {
                await eventsCollection.updateOne({id: event.id}, {$set: event});
                res = true;
            }
        }
        catch (e) {
            res = false;
        }
        finally {
            await mongoClient.close();
            return res
        }
    }

    async goldTotal(login: string, usLogin?: string, treasury?: boolean, addr?: number) {
        let goldData;
        try {
            let extBuf: any[];
            await mongoClient.connect();
            extBuf = await collection.find({login: login}).toArray();
            if (extBuf.length) {
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer') || (extBuf[0].login === usLogin)) {
                    if (usLogin) {
                        const result = treasury?
                            await goldTotalCollection.find({id: addr, login: usLogin}).toArray():
                            await goldCollection.find({login: usLogin}).toArray();
                        goldData = {res: 'ok', data: { ...result[0]}}
                    }
                    else {
                        const result = treasury?
                            await goldTotalCollection.find({id: addr, login: '123total'}).toArray():
                            await goldCollection.find({login: '123total'}).toArray();
                        if (result.length) goldData = {res: 'ok', data: { total: result[0].total || 0, history: result[0].history || []}}
                        else goldData = {res: 'noData'}
                    }
                } 
                else goldData = {res: 'not auth'}
            }
            else goldData = {res: 'not auth'};
        }catch(err) {
            goldData = {res: 'err'};
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

    async newGoldValue(obj: {login: string, value: number, date: number, veryfi: string, way?: string, from?: number}, auth: string, treasury?: boolean, addr?: number ) {
        console.log(treasury);
        let revObj = {...obj, value: -obj.value};
        let res: boolean = false;
        try {
            await mongoClient.connect();
            let extBuf: any[] = await collection.find({login: auth}).toArray();
            if (extBuf.length) {
                console.log(obj.from)
                console.log(obj.from === undefined)
                if ((extBuf[0].role === 'Lord') || (extBuf[0].role === 'Treasurer') || (!treasury&&(obj.login===auth)&&(addr!==0))) {
                    if (treasury) {
                        const result = await goldTotalCollection.find({id: addr, login: '123total'}).toArray();
                        console.log(result);
                        if (result.length === 0) await goldTotalCollection.insertOne({id: addr, login: '123total', total: obj.value, history: [obj]});
                        else {
                            result[0].history.push(obj);
                            let newVal = {total: result[0].total + obj.value, history: result[0].history};
                            await goldTotalCollection.updateOne({id: addr, login: '123total'}, {$set: newVal})
                        }
                        if ((obj.from === -1)||(obj.from === undefined)||(obj.from === null)) {
                            console.log(-1);
                            let moneyBuf: any[] = await goldCollection.find({login: obj.login}).toArray();
                            if (moneyBuf.length) {
                                moneyBuf[0].history.push(revObj);
                                let newData = {total: moneyBuf[0].total - obj.value, history: moneyBuf[0].history};
                                await goldCollection.updateOne({login: obj.login}, {$set: newData});
                            }
                            else {
                                await goldCollection.insertOne({login: obj.login, total: -obj.value, history: [revObj]})
                            }
                            let goldTotalCollectionData: any[] = await goldCollection.find({login: '123total'}).toArray();
                            if (goldTotalCollectionData.length) {
                                goldTotalCollectionData[0].history.push(revObj);
                                let newData = {total: (goldTotalCollectionData[0].total||0) - obj.value, history: goldTotalCollectionData[0].history};
                                console.log(newData);
                                await goldCollection.updateOne({login: '123total'}, {$set: newData});
                            }
                            else await goldCollection.insertOne({login: '123total', total: - obj.value, history: [revObj]});
                            let buf: any[] = await collection.find({login: obj.login}).toArray();
                            buf[0].gold = (buf[0].gold||0) - obj.value;
                            await this.updateOne({login: buf[0].login}, {gold: buf[0].gold});
                            res = true;
                        }
                        else {
                            let totalVal = await goldTotalCollection.find({id: obj.from}).toArray();
                            if (totalVal.length === 0) await goldTotalCollection.insertOne({id: obj.from, login: obj.login, total: obj.value, history: [{...revObj, addr}], sale: 0, status: 0})
                            else {
                                totalVal[0].history.push(revObj);
                                let newVal = {total: totalVal[0].total - obj.value, history: totalVal[0].history};
                                await goldTotalCollection.updateOne({id: obj.from, login: '123total'}, {$set: newVal})
                                if (obj.from !== 0) {
                                    let event: any[] = await eventsCollection.find({id: obj.from}).toArray();
                                    await eventsCollection.updateOne({id: obj.from}, {$set: {gold: event[0].gold - obj.value}})
                                }
                            }
                            res = true;
                        }
                    }
                    else {
                        let moneyBuf: any[] = await goldCollection.find({login: obj.login}).toArray();
                        let gold: number = 0;
                        if (moneyBuf.length) {
                            moneyBuf[0].history.push(obj);
                            gold = moneyBuf[0].total + obj.value;
                            let newData = {total: gold, history: moneyBuf[0].history};
                            await goldCollection.updateOne({login: obj.login}, {$set: newData});
                        }
                        else {
                            gold = obj.value;
                            await goldCollection.insertOne({login: obj.login, total: obj.value, history: [obj]})
                        }
                        console.log('else');
                        let buf: any[] = await collection.find({login: obj.login}).toArray();
                        await collection.updateOne({login: buf[0].login}, {$set: {gold: gold}});
                        res = true;
                        let goldTotalCollectionData: any[] = await goldCollection.find({login: '123total'}).toArray();
                        if (goldTotalCollectionData.length) {
                            goldTotalCollectionData[0].history.push(obj);
                            let newData = {total: (goldTotalCollectionData[0].total||0) + obj.value, history: goldTotalCollectionData[0].history};
                            await goldCollection.updateOne({login: '123total'}, {$set: newData});
                        }
                        else await goldCollection.insertOne({login: '123total', total: obj.value, history: [obj]});
                    }
                    console.log(res);
                }
            }
        }catch(err) {
            console.log(err)
        } finally {
            await mongoClient.close();
            return res;
        }
    }

    async updatePersonalValue(obj: {login: string, value: number, date: number}, auth: string, treasury?: boolean, addr?: number ) {
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
                        await goldTotalCollection.find({id: addr, login: obj.login}):
                        await goldCollection.find({login: obj.login});
                    if (result.length>0) {
                        if (Array.isArray(result[0].history)) {
                            for (let i = 0; i<result[0].history.length; i++) {
                                if ((result[0].history[i].login === obj.login) && (result[0].history[i].date === obj.date)) {
                                    if (obj.value === 0) result[0].history.slice(i, 1);
                                    else {
                                        res.total = result[0].history[i].value - obj.value;
                                        result[0].history[i].value = obj.value;
                                        result[0].history[i].upd = Number(new Date());
                                        result[0].history[i].updBy = extBuf[0].login;
                                        res.done = true;
                                    }
                                    break;
                                }
                            }
                            if (treasury)
                            {
                                await goldTotalCollection.updateOne({login: obj.login, id: addr}, {$set: {total: result[0].total - res.total, history: result[0].history}});
                            }
                            else await goldCollection.updateOne({login: obj.login}, {$set: {total: result[0].total - res.total, history: result[0].history}});
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