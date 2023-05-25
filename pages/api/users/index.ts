import NextCors from 'nextjs-cors';
const mongo = require('./../../../src/mech/mongo');
const mongoS = new mongo();

interface logData {
    login: string,
    password: string
}

export default async function handler(req: any, res: any) {
    console.log(req.method);
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        console.log(req.headers)
        if (req.headers?.authorization!==undefined)
            {
                let dat = await mongoS.find({token: req.headers.authorization.substr(7)});
                if (dat.length) {
                    if (dat[0].role==='Secretary') {
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