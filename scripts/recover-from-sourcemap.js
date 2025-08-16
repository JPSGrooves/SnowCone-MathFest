const fs=require('fs'),path=require('path');
const map=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
(map.sources||[]).forEach((src,i)=>{
  const content=(map.sourcesContent&&map.sourcesContent[i])||'';
  const rel=src.replace(/^webpack:\/\//,'').replace(/^vite\//,'').replace(/^.*?(src|public)\//,'$1/');
  const out=path.join('recovered_src', rel||('unknown/'+i));
  fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,content);
  console.log('wrote', out);
});
