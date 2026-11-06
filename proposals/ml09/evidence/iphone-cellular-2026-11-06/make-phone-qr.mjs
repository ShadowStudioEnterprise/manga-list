import {createRequire} from 'node:module'
import {readFileSync,writeFileSync} from 'node:fs'
import {deflateSync} from 'node:zlib'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('./cellular-live-20261106/',import.meta.url))
const require=createRequire(import.meta.url)
const QR=require(root+'tools/qrcode-terminal/package/vendor/QRCode')
const levels=require(root+'tools/qrcode-terminal/package/vendor/QRCode/QRErrorCorrectLevel')
const entry=JSON.parse(readFileSync(root+'private/entry-phone.json'))
if(entry.deadline<=Date.now())throw Error('Entry expired')
const qr=new QR(-1,levels.M);qr.addData(entry.entry);qr.make()
const scale=6,quiet=4,n=qr.getModuleCount(),width=(n+quiet*2)*scale
const pixels=Buffer.alloc((width+1)*width,255)
for(let y=0;y<width;y++){pixels[y*(width+1)]=0;for(let x=0;x<width;x++){const row=Math.floor(y/scale)-quiet,col=Math.floor(x/scale)-quiet;if(row>=0&&col>=0&&row<n&&col<n&&qr.isDark(row,col))pixels[y*(width+1)+1+x]=0}}
function crc32(data){let crc=0xffffffff;for(const value of data){crc^=value;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return(crc^0xffffffff)>>>0}
function chunk(name,data){const type=Buffer.from(name),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([size,type,data,crc])}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(width,4);ihdr[8]=8
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))])
writeFileSync(root+'private/entrada-iphone.png',png,{mode:0o600})
console.log(JSON.stringify({file:root+'private/entrada-iphone.png',width,deadlineMadrid:new Date(entry.deadline).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}),remainingMinutes:Math.floor((entry.deadline-Date.now())/60000)}))
