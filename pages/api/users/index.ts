import NextCors from 'nextjs-cors';

interface logData {
    login: string,
    password: string
}

export default async function handler(req, res) {
    console.log(req.method);
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });
    if (req.method==='POST'){
        console.log(req.method);
        console.log(req.headers);
        /*let buf: logData;
        if (typeof(req.body)==='string') {
            buf = JSON.parse(req.body)
        }
        else buf = req.body;
        console.log(buf);
        console.log('\n\nend\n\n')*/
        res.status(200).json({ token: '1', firstName: '2', lastName: '3', role: 'Lord' })
    }
}