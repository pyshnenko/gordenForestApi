const mongo = require('./../../src/mech/mongo');
const mailSend = require('./../../src/mech/mail');
const mail = new mailSend('https://gf.spamigor.ru', process.env.SKEY);
let jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
import NextCors from 'nextjs-cors';
const mongoS = new mongo();

export interface RegisterReqData { 
    first_name: String,
    last_name: String,
    login: String,
    email: String,
    password: String
}

const log4js = require("log4js");

log4js.configure({
    appenders: { 
        cApi: { type: "file", filename: "log/gflog.log" }, 
        console: { type: 'console' },
    },
    categories: { default: { appenders: ['console', "cApi"], level: "all" },
                mailer: { appenders: ['console', 'cApi'], level: 'all' }, },
  });
const logger = log4js.getLogger("cApi");
const mails = log4js.getLogger('mailer');

export default async function handler(req: any, res: any) {
    console.log('hello')
    console.log(req.method);
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        logger.info(req.body);
        let buf: RegisterReqData;
        if (typeof(req.body)==='string') {
            buf = JSON.parse(req.body)
        }
        else buf = req.body;
        
        let dat = await mongoS.find({login: buf.login});
        logger.debug('Записей: ' + dat.length);
        if (dat.length) res.status(401).json({ status: 'bored' });
        else {
            let atoken = await bcrypt.hash((buf.password+buf.email.trim()), '$2b$10$1'+String(process.env.SALT_CRYPT))
            let id = await mongoS.id() + 1;
            const saveData = {...buf, id, gold: 0, role: id===1?'Lord':'Stranger'};
            let token = await jwt.sign(saveData, String(process.env.SALT_CRYPT));
            if (!(req.headers?.make==='example')) mongoS.incertOne({...saveData, token, password: atoken});
            res.status(200).json({ token, first_name: buf.first_name, last_name: buf.last_name, role: id===1?'Lord':'Stranger', id, login: buf.login, email: buf.email })
            const dataForMailCheck = {id, atoken, login: buf.login};
            console.log('MAIL');
            mail.sendMail(buf.email, buf.login);
            if (!(req.headers?.make==='example')) mails.info('Новый пользователь: ', buf.first_name);
        }
        console.log('\nend\n')
    }
    if (req.method==='GET') {
        let text = await mail.decryptHash(req.query.name.replaceAll(' ', '+'));
        let dat = await mongoS.find({login: text});    
        console.log(dat);
        await mongoS.updateOne({login: dat[0].login}, {emailVerify: true});        
        res.status(200).json({ver: true});
    }
}