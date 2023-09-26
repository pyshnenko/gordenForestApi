require('dotenv').config();
const fs = require("fs");
var CryptoJS = require("crypto-js");
const nodemailer = require('nodemailer');
let testEmailAccount = nodemailer.createTestAccount();
let myURL = 'https://gf.spamigor.ru/api';

let options = {
    key: fs.readFileSync("/etc/letsencrypt/live/gf.spamigor.ru/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/gf.spamigor.ru/fullchain.pem"),
	ca: fs.readFileSync("/etc/letsencrypt/live/gf.spamigor.ru/chain.pem")
};

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',//'smtp.mail.ru',
    port: 465,
    secure: true,
    key: options.key,
    cert: options.cert,
    ca: options.ca,
    auth: {
      user: process.env.MAILUSER,
      pass: process.env.MAILPASS
    },
});

let sKey = process.env.SKEY;

class mailFunction {
    constructor(url: string, salt: string) {
        if (url) myURL=url;
        if (salt) sKey=salt;
    }

    urlAsk() {
        return myURL;
    }

    async cryptHash(hash: string) {
        console.log(hash);
        let buf = hash.toString();
        let ciphertext = encodeURIComponent(await CryptoJS.AES.encrypt(buf, sKey).toString());
        console.log(ciphertext);
        return ciphertext;
    }

    async decryptHash(ciphertext: string) {
        console.log('decr');
        console.log(ciphertext);
        console.log(decodeURIComponent(ciphertext))
        let bytes = await CryptoJS.AES.decrypt(decodeURIComponent(ciphertext), sKey);
        console.log('bytes');
        console.log(bytes);
        let originalText = await bytes.toString(CryptoJS.enc.Utf8);
        console.log('original')
        console.log(originalText);
        console.log('exit')
        return originalText;
    }

    async sendMail(addr: string, hash: string) {
        console.log('addr', addr)
        let hashS = await this.cryptHash(hash);
        let hashA = await this.cryptHash(addr);
        transporter.sendMail({
            from: `<${String(process.env.MAILUSER)}>`,
            to: addr,
            subject: 'Подтверждение почты',
            text: `Подтвердите почту ${addr} пройдя по ссылке ${myURL}?name=${hashS}&addr=${hashA}`,
            html:
            `<h1>Приветствуем в золотолесье!</h1>
            Подтвердите почту ${addr} пройдя по ссылке <a href="${myURL}?name=${hashS}&addr=${hashA}">тыкни сюда</a>`,
        }).catch((e: any) => {console.log('error',e)});
    }
}

module.exports = mailFunction;