import NextCors from 'nextjs-cors';

export default async function handler(req, res) {
    console.log(req.method);
    console.log(req.header);
    console.log(req.body);
    console.log('\n\nend\n\n')
    res.status(200).json({ result: 'ok' })
}