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

interface logData {
    login: string,
    password: string
}

export default async function handler(req: any, res: any) {
    logger.info(req.method + 'users');
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        console.log(req.headers)
        if (req.headers?.authorization!==undefined)
            {
                let verToken = await jwt.verify(req.headers.authorization.substr(7), String(process.env.SALT_CRYPT));
                let time = new Date(Number((new Date()).setHours((new Date()).getHours() - 3)) - verToken.iat*1000);
                logger.debug(verToken.login + '\n' + time)
                let dat = await mongoS.find({login: verToken.login});
                if (dat.length) {
                    if ((dat[0].role==='Secretary')||(dat[0].role==='Lord')) {
                        let result = await mongoS.find();
                        result.map((item: any)=>{
                            delete(item._id);
                            delete(item.password);
                            delete(item.token);
                        })
                        res.status(200).json(result);
                    }
                    else {
                        res.status(401).json({res: 'not debt'});
                    }
                }
                else res.status(403).json({res: 'incorrectToken'});
            }
        else {
            res.status(402).json({res: 'unAutorized'});
        }
    }
}