const mongo = require('./../../src/mech/mongo');
const fs = require('fs');
let jwt = require('jsonwebtoken');
import NextCors from 'nextjs-cors';
const mongoS = new mongo();
const bcrypt = require('bcrypt');

const log4js = require("log4js");

log4js.configure({
    appenders: { 
        cApi: { type: "file", filename: "log/gfLoginUpdlog.log" }, 
        console: { type: 'console' },
    },
    categories: { default: { appenders: ['console', "cApi"], level: "all" },
                mailer: { appenders: ['console', 'cApi'], level: 'all' }, },
  });
const logger = log4js.getLogger("cApi");

export default async function handler(req: any, res: any) {
    console.log('hello loginAuth')
    console.log(req.method);
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        if (req.headers?.authorization!==undefined) {
            let verToken = await jwt.verify(req.headers.authorization.substr(7), String(process.env.SALT_CRYPT));
            let time = new Date(Number((new Date()).setHours((new Date()).getHours() - 3)) - verToken.iat*1000);
            logger.debug(verToken.login + '\n' + time)
            let dat = await mongoS.find({login: verToken.login});
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
        else res.status(402).json({res: 'not auth'});
    }
}