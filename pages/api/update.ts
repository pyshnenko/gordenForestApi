import NextCors from 'nextjs-cors';
const mongo = require('./../../src/mech/mongo');
const mongoS = new mongo();
let jwt = require('jsonwebtoken');

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
    logger.info(req.method + 'update');
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        if ((req.headers?.authorization!==undefined)&&(req.hasOwnProperty('body')))
            {
                let verToken = await jwt.verify(req.headers.authorization.substr(7), String(process.env.SALT_CRYPT));
                let time = new Date(Number((new Date()).setHours((new Date()).getHours() - 3)) - verToken.iat*1000);
                logger.debug(verToken.login + '\n' + time)
                let dat = await mongoS.find({login: verToken.login});
                if (dat.length) {
                    if ((dat[0].role==='Secretary')||(dat[0].role==='Lord')) {
                        let buf: any;
                        if (typeof(req.body)==='string') {
                            buf = JSON.parse(req.body)
                        }
                        else buf = req.body;
                        if (buf.hasOwnProperty('gold')&&(typeof(buf.gold)==='string')) buf.gold = Number(buf.gold);
                        if (buf.hasOwnProperty('role')&&(buf.role==='Stranger')) buf.nickname='';
                        let result = await mongoS.updateOne({login: buf.login}, buf);
                        res.status(200).json({res: 'ok'});
                    }
                    else {
                        res.status(401).json({res: 'not debt'});
                    }
                }
                else res.status(403).json({res: 'incorrectToken or body'});
            }
        else {
            res.status(402).json({res: 'unAutorized'});
        }
    }
}