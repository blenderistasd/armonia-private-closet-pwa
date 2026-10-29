/* Copy only the static client; never package tests, backups, fixtures or personal images. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),target=path.join(root,'www');
fs.mkdirSync(target,{recursive:true});
for(const filename of ['index.html','styles.css','app.js','engine.js','storage.js','demo.js','sw.js','manifest.webmanifest']){
  fs.copyFileSync(path.join(root,filename),path.join(target,filename));
}
fs.cpSync(path.join(root,'assets'),path.join(target,'assets'),{recursive:true,force:true});
console.log('Static web asset bundle assembled in www/');
