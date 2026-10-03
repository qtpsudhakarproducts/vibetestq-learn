// Local review server; existing learning auth deliberately allows localhost previews.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.md':'text/markdown; charset=utf-8'};
http.createServer((req,res)=>{
  let pathname;
  try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(e){res.writeHead(400);res.end('Invalid path');return;}
  let file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Invalid path');return;}
  if(!fs.existsSync(file)&&fs.existsSync(file+'.html'))file+='.html';
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  let status=200;
  if(!fs.existsSync(file)){file=path.join(root,'404.html');status=404;}
  fs.readFile(file,(error,content)=>{res.writeHead(error?500:status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'Could not load page':content);});
}).listen(8780,'127.0.0.1',()=>console.log('Academy preview: http://127.0.0.1:8780/'));
