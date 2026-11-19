import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const runtime='C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules';
const req=createRequire(runtime+'/');
const {Presentation}=await import(pathToFileURL(req.resolve('@oai/artifact-tool')).href);
const p=Presentation.create({slideSize:{width:4300,height:2500}}), s=p.slides.add();
s.background.fill='#ffffff';
const ink='#1f2933', green='#d7eed2', blue='#e4eef9', yellow='#fff0c6', stroke='#41586b';
function rect(type,x,y,w,h,fill,outline=stroke){return s.shapes.add({geometry:type,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:outline,width:3}});}
function text(t,x,y,w,h,size=32,bold=false,color=ink){let sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:'none',width:0}});sh.text=t;sh.text.style={typeface:'Arial',fontSize:size,bold,color,alignment:'center',verticalAlignment:'middle',wrap:'square',autoFit:'shrinkText',insets:0};return sh;}
function line(x1,y1,x2,y2){const left=Math.min(x1,x2),top=Math.min(y1,y2);s.shapes.add({geometry:'line',position:{left,top,width:Math.max(1,Math.abs(x2-x1)),height:Math.max(1,Math.abs(y2-y1)),horizontalFlip:x2<x1,verticalFlip:y2<y1},fill:'none',line:{style:'solid',fill:stroke,width:3}});}
text('БАЗА ДАННЫХ КИНОТЕАТРА: ТАБЛИЦЫ, ПОЛЯ И СВЯЗИ',110,30,4080,90,55,true,'#074b9a');
text('Нотация Чена: сущности, атрибуты, связи и кратность',150,125,4000,65,34,false,'#4b6477');
const entities=[
 {x:450,name:'genres\nЖанры',a:['id\nINT UNSIGNED · PK · NN','name\nVARCHAR(100) · UQ · NN','description\nTEXT · NULL']},
 {x:1300,name:'movie_genres\nЖанры фильмов',a:['movie_id\nINT UNSIGNED · PK, FK · NN','genre_id\nINT UNSIGNED · PK, FK · NN']},
 {x:2150,name:'movies\nФильмы',a:['id\nINT UNSIGNED · PK · NN','title\nVARCHAR(255) · NN','description\nTEXT · NULL','duration_minutes\nSMALLINT UNSIGNED · NN','release_year\nSMALLINT UNSIGNED · NULL','age_rating\nVARCHAR(10) · NULL']},
 {x:3000,name:'sessions\nСеансы',a:['id\nINT UNSIGNED · PK · NN','movie_id\nINT UNSIGNED · FK · NN','hall_id\nINT UNSIGNED · FK · NN','starts_at\nDATETIME · NN','ticket_price\nDECIMAL(10,2) · NN']},
 {x:3850,name:'tickets\nБилеты',a:['id\nINT UNSIGNED · PK · NN','session_id\nINT UNSIGNED · FK · NN','row_number\nSMALLINT UNSIGNED · NN','seat_number\nSMALLINT UNSIGNED · NN','price\nDECIMAL(10,2) · NN','sold_at\nDATETIME · NN · DEFAULT CURRENT_TIMESTAMP']}
];
function drawEntity(e, y=1020, downward=false){
 let first=downward?1850:260;
 let n=Math.ceil(e.a.length/2);
 if(!downward){line(e.x,first+65,e.x,y);}
 else {line(e.x,y+145,e.x,first+(n-1)*190+65);}
 for(let i=0;i<e.a.length;i++){
   let side=i%2===0?-1:1, row=Math.floor(i/2), x=e.x+(side<0?-370:70), yy=first+row*190;
   line(e.x,yy+65,side<0?x+300:x,yy+65);
   rect('ellipse',x,yy,300,130,blue); text(e.a[i],x+20,yy+16,260,98,e.a[i].includes('CURRENT_TIMESTAMP')?19:23,true);
 }
 rect('rect',e.x-190,y,380,145,green); text(e.name,e.x-175,y+12,350,120,40,true);
}
entities.forEach(e=>drawEntity(e));
const hall={x:3000,name:'halls\nЗалы',a:['id\nINT UNSIGNED · PK · NN','name\nVARCHAR(100) · UQ · NN','rows_count\nSMALLINT UNSIGNED · NN','seats_per_row\nSMALLINT UNSIGNED · NN']};
drawEntity(hall,1580,true);
function rel(x1,x2,label,left,right){
 const y=1092,mid=(x1+x2)/2; line(x1+190,y,x2-190,y);rect('diamond',mid-100,y-75,200,150,yellow);text(label,mid-72,y-48,144,96,26,true);text(left,x1+200,y-50,60,40,30,true);text(right,x2-260,y-50,60,40,30,true);
}
rel(450,1300,'имеет','1','N');rel(1300,2150,'относится','N','1');rel(2150,3000,'сеансы','1','N');rel(3000,3850,'содержит','1','N');
line(3000,1165,3000,1580);rect('diamond',2900,1290,200,150,yellow);text('проходит\nв зале',2925,1320,150,90,26,true);text('N',3030,1210,60,45,30,true);text('1',3030,1500,60,45,30,true);
text('PK — первичный ключ    FK — внешний ключ    NN — NOT NULL    UQ — UNIQUE    NULL — значение необязательно',120,2350,4060,55,29,false,'#4b6477');
text('Один фильм может относиться к нескольким жанрам через таблицу movie_genres. Место уникально в пределах сеанса.',120,2410,4060,45,27,false,'#4b6477');
const blob=await p.export({slide:s,format:'png',scale:1});
await fs.writeFile(path.join(process.cwd(),'presentation','Схема_базы_кинотеатра.png'),new Uint8Array(await blob.arrayBuffer()));
