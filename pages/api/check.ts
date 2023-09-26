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
            let result: {login?: boolean, email?: boolean} = {};
            if ((typeof(buf)==='object')&&(buf.hasOwnProperty('login'))){
                let dat = await mongoS.find({login: buf.login});
                result.login = dat.length===0;
            }
            if ((typeof(buf)==='object')&&(buf.hasOwnProperty('email'))){
                let dat = await mongoS.find({email: buf.email});
                result.email = dat.length===0;
            }
            res.status(200).json({...result});
        }
        else res.status(401).json({res: 'no checked data'});
    }
}