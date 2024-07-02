const mongo = require('./../../src/mech/mongo');
const fs = require('fs');
let jwt = require('jsonwebtoken');
import NextCors from 'nextjs-cors';
const mongoS = new mongo();
const bcrypt = require('bcrypt');

interface logData {
    email: string,
    password: string
}

const log4js = require("log4js");

log4js.configure({
    appenders: { 
        cApi: { type: "file", filename: "log/gfLoginlog.log" }, 
        console: { type: 'console' },
    },
    categories: { default: { appenders: ['console', "cApi"], level: "all" },
                mailer: { appenders: ['console', 'cApi'], level: 'all' }, },
  });
const logger = log4js.getLogger("cApi");

export default async function handler(req: any, res: any) {
    //console.log('hello')
    console.log(req.method);
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        logger.info(req.body);
        let buf: logData;
        if (typeof(req.body)==='string') {
            buf = JSON.parse(req.body)
        }
        else buf = req.body;
        console.log(buf);
        const atoken = await bcrypt.hash((buf.password+buf.email.trim()), '$2b$10$1'+String(process.env.SALT_CRYPT))
        let dat = await mongoS.find({password: atoken});
        logger.debug('Записей: ' + dat.length);
        if (dat.length) {
            delete(dat[0]._id);
            const token = dat[0].token;
            delete(dat[0].token);
            delete(dat[0].password);
            const nTok = await jwt.sign(dat[0], String(process.env.SALT_CRYPT));
            if (nTok!==token) {
                mongoS.updateOne({login: dat[0].login}, {token: nTok});
                dat[0].token=nTok;
            }
            else dat[0].token=token;
            res.status(200).json(dat[0]);
        }
        else {
            res.status(401).json({res: false});
        }
        console.log('\nend\n')
    }
}