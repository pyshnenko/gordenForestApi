import NextCors from 'nextjs-cors';
const mongo = require('./../../../src/mech/mongo');
const mongoS = new mongo();

export default async function handler(req: any, res: any) {
    console.log(req.method);
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        console.log(req.headers)
        if ((req.headers?.authorization!==undefined)&&(req.hasOwnProperty('body')))
            {
                let dat = await mongoS.find({token: req.headers.authorization.substr(7)});
                if (dat.length) {
                    if ((dat[0].role==='Secretary')||(dat[0].role==='Lord')) {
                        let buf: any;
                        if (typeof(req.body)==='string') {
                            buf = JSON.parse(req.body)
                        }
                        else buf = req.body;
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