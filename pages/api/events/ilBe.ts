import NextCors from 'nextjs-cors';
const mongo = require('./../../../src/mech/mongo');
const Event = require('./../../../src/mech/mongo');
const mongoS = new mongo();
let jwt = require('jsonwebtoken');

const log4js = require("log4js");

log4js.configure({
    appenders: { 
        cApi: { type: "file", filename: "log/total.log" }, 
        console: { type: 'console' },
    },
    categories: { default: { appenders: ['console', "cApi"], level: "all" },
                mailer: { appenders: ['console', 'cApi'], level: 'all' }, },
  });
const logger = log4js.getLogger("ilBe");

export default async function handler(req: any, res: any) {
    logger.info(req.method + ' total');
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        if (req.headers?.authorization!==undefined)
            {
                let verToken = await jwt.verify(req.headers.authorization.substr(7), String(process.env.SALT_CRYPT));
                let time = new Date(Number((new Date()).setHours((new Date()).getHours() - 3)) - verToken.iat*1000);
                logger.debug(verToken.login + '\n' + time)
                let dat = await mongoS.find({login: verToken.login});
                if (dat.length) {                    
                    if (req.hasOwnProperty('body')&&(typeof(req.body)==='object')&&(Object.keys(req.body).length>1)){
                        let buf: {login: string, example?: boolean, id: number, del?: boolean};
                        if (typeof(req.body)==='string') {
                            buf = JSON.parse(req.body)
                        }
                        else buf = req.body;           
                        let result = await mongoS.eventsIBe(buf.login, buf.id, buf?.del);
                        res.status(200).json({res: result});
                    }
                    else res.status(403).json({res: 'incorrectToken or body'});
                }
                else res.status(403).json({res: 'incorrectToken or body'});
            }
        else {
            res.status(402).json({res: 'unAutorized'});
        }
    }
}