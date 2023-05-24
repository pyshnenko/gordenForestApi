const mongo = require('./../../../src/mech/mongo');
const fs = require('fs');
let jwt = require('jsonwebtoken');

const mongoS = new mongo();

interface logData {
    login: string,
    password: string
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

export default async function handler(req, res) {
    if (req.method==='POST'){
        logger.info(req.body);
        let buf: logData;
        if (typeof(req.body)==='string') {
            buf = JSON.parse(req.body)
        }
        else buf = req.body;
        let dat = await mongoS.find({login: buf.login});
        logger.debug('Записей: ' + dat.length);
        if (dat.length) res.status(401).json({ status: 'bored' });
        else {
            let id = await mongoS.id() + 1;
            let token = await jwt.sign({...buf, id}, process.env.SALT+buf.login+buf.password);
            mongoS.incertOne({...buf, id, token});
            res.status(200).json({ token, first_name: buf.first_name, last_name: buf.last_name, role: 'Peasant', id })
            mails.info('Новый пользователь: ', buf.first_name);
        }
        console.log('\nend\n')
    }
}