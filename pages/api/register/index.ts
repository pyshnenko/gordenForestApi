const mongo = require('./../../../src/mech/mongo');
const fs = require('fs');
let jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
import NextCors from 'nextjs-cors';
const mongoS = new mongo();

export interface RegisterReqData { 
    first_name: String,
    last_name: String,
    login: String,
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
            let atoken = await bcrypt.hash((req.body.pass+req.body.login.trim()), '$2b$10$1'+String(process.env.SALT_CRYPT))
            let id = await mongoS.id() + 1;
            const saveData = {...buf, password: atoken, id, role: 'Peasant'};
            let token = await jwt.sign(saveData, String(process.env.SALT_CRYPT));
            if (!(req.headers?.make==='example')) mongoS.incertOne({...saveData, token});
            res.status(200).json({ token, first_name: buf.first_name, last_name: buf.last_name, role: 'Peasant', id })
            if (!(req.headers?.make==='example')) mails.info('Новый пользователь: ', buf.first_name);
        }
        console.log('\nend\n')
    }
}