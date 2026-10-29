import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";

const ROOT=resolve(process.cwd());
const PORT=Number(process.env.PORT || 5173);
const MIME={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url || "/", "http://localhost");
    const pathname=decodeURIComponent(url.pathname);
    const target=resolve(ROOT,"."+ (pathname==="/" ? "/index.html":pathname));
    const relativePath=relative(ROOT,target);
    if(relativePath.startsWith("..") || relativePath.includes(".."+"/") || relativePath==="") {
      res.writeHead(403);res.end("Forbidden");return;
    }
    const info=await stat(target);
    if(!info.isFile()){res.writeHead(404);res.end("Not found");return;}
    res.writeHead(200,{"Content-Type":MIME[extname(target)]??"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
    if(req.method==="HEAD"){res.end();return;}
    res.end(await readFile(target));
  }catch{
    res.writeHead(404);res.end("Not found");
  }
});
server.listen(PORT,"127.0.0.1",()=>console.log("Loteria Lab disponível em http://127.0.0.1:"+PORT));
