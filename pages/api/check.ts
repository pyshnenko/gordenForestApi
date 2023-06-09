import NextCors from 'nextjs-cors';
const mongo = require('./../../src/mech/mongo');
const mongoS = new mongo();

interface checkData {
    login: string,
    email: string
}

export default async function handler(req: any, res: any) {
    console.log(req.method);
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        if (req.hasOwnProperty('body')) {            
            let buf: any;
            if (typeof(req.body)==='string') {
                buf = JSON.parse(req.body)
            }
            else buf = req.body;
            let dat = await mongoS.find(buf);
            if (dat.length===0) res.status(200).json({res: 'free'});
            else res.status(402).json({res: 'not free'})
        }
        else res.status(401).json({res: 'no checked data'});
    }
}