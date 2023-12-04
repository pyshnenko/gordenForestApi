const express = require("express");
const multer  = require("multer");
const cors = require('cors');
const fs = require('fs');
process.title='APIServerGF';
const app = express();

app.use(cors())

let name = '';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix);
    name = file.fieldname + '-' + uniqueSuffix;
  }
})

const upload = multer({ storage: storage })
  
app.use(express.static(__dirname));

app.get("/pict*", function(request, response){
    filePath = request.url.substr(1);
    fs.readFile(filePath, function(error, data){              
        if(error){                  
            response.statusCode = 404;
            response.end("Resourse not found!");
        }   
        else{
            response.end(data);
        }
    });
});


app.use(upload.single("file"));
app.post("/apiUpload", function (req, res, next) {
    console.log('im here');
    let filedata = req.body;
    if(!filedata)
        res.send({res: 'error'});
    else
    {
        let ddir = [];
        let jjj = fs.readdirSync("pict", { withFileTypes: true });
        jjj=jjj.filter(d => d.isDirectory());
        jjj.map(d => ddir.push(d.name));
        let folderName = decodeURI(req.headers.folder);
        let filesAll =  fs.readdirSync('pict');
        if (folderName.length > 20) {folderName.slice(0, 20); folderName+=filesAll.length;}
        if (!ddir.includes(folderName)) fs.mkdir(`pict/${folderName}`, err => {
          if(err) throw err; // не удалось создать папку
            console.log('Папка успешно создана');
        });
        let newName = `pict/${folderName ? folderName : 'base'}/${decodeURI(req.headers.fname)}`;
        fs.rename(`uploads/${name}`, `${newName}`, err => {
          if(err) throw err; // не удалось переместить файл
            console.log('Файл успешно перемещён');
        });
        res.send({res: 'ok', addr: newName});
    }
});

app.listen(8768, ()=>console.log('start'));