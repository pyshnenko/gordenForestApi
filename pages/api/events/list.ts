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
const logger = log4js.getLogger("cApi");

export default async function handler(req: any, res: any) {
    logger.info(req.method + ' total');
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){ 
        if (req.hasOwnProperty('body')&&(typeof(req.body)==='object')&&(Object.keys(req.body).length>=6)){
            let buf: {id: number};
            if (typeof(req.body)==='string') {
                buf = JSON.parse(req.body)
            }
            else buf = req.body;             
            let result = await mongoS.eventslist(buf.id);
            res.status(200).json({res: result});
        }
        else {
            let result = await mongoS.eventslist();
            res.status(200).json(result);
        }
    }
}