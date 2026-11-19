import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const runtimeModules = 'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules';
const req = createRequire(runtimeModules + '/');
const { Presentation, PresentationFile } = await import(pathToFileURL(req.resolve('@oai/artifact-tool')).href);
const skill = 'C:/Users/dmitr/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations';
const { finalizePresentation } = await import(pathToFileURL(skill + '/container_tools/artifact_tool_utils.mjs').href);
const workspace = process.cwd();
const screens = path.join(workspace,'.presentation_build','screens');
const build = path.join(workspace,'.presentation_build','draft');
const output = path.join(workspace,'presentation','Курсовая_Кинотеатр_со_схемой.pptx');
await fs.mkdir(build,{recursive:true}); await fs.mkdir(path.dirname(output),{recursive:true});
const ppt = Presentation.create({slideSize:{width:1152,height:864}});
const blue='#064c9e', navy='#073e82', pale='#e8f3fc', ink='#202e3d', gray='#596777', white='#ffffff';
function shape(s,x,y,w,h,fill='none',stroke='none',sw=0) { return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:stroke,width:sw}}); }
function txt(s,t,x,y,w,h,size=25,color=ink,bold=false,align='left') {
  const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:'none',width:0}});
  a.text=t; a.text.style={typeface:'Arial',fontSize:size,color,bold,alignment:align,verticalAlignment:'middle',wrap:'square',autoFit:'shrinkText',insets:0}; return a;
}
function page(title, number) {
 const s=ppt.slides.add(); s.background.fill=white;
 txt(s,'КУРСОВАЯ РАБОТА  ·  ИНФОРМАЦИОННАЯ СИСТЕМА КИНОТЕАТРА',48,24,1056,47,23,blue,true,'center');
 shape(s,0,95,1152,57,blue); txt(s,title.toUpperCase(),30,101,1092,43,24,white,true,'center');
 txt(s,String(number),1080,820,30,24,15,gray,false,'right'); return s;
}
function box(s,title,body,x,y,w,h) {
 shape(s,x,y,w,h,white,blue,2); shape(s,x,y,10,h,blue);
 txt(s,title,x+25,y+14,w-45,32,22,blue,true); txt(s,body,x+25,y+53,w-45,h-64,19,ink);
}
async function picture(s,name,x,y,w,h) {const bytes=await fs.readFile(path.join(screens,name+'.png')); s.images.add({blob:new Uint8Array(bytes),contentType:'image/png',alt:'Интерфейс кинотеатра: '+name,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function small(s,t) {txt(s,t,50,790,1040,25,16,gray,false,'center');}

// Титульный слайд.
{
 const s=ppt.slides.add(); s.background.fill=white;
 txt(s,'[НАЗВАНИЕ УЧЕБНОГО ЗАВЕДЕНИЯ]',75,45,1002,76,25,blue,true,'center');
 shape(s,0,149,1152,7,blue);
 txt(s,'КУРСОВАЯ РАБОТА',75,220,1002,43,25,gray,true,'center');
 txt(s,'Разработка информационной системы для учёта киносеансов, залов и продаж билетов',90,285,972,176,37,blue,true,'center');
 shape(s,0,600,1152,264,blue);
 txt(s,'Выполнил(а):  __________________________',620,635,475,44,21,white);
 txt(s,'Группа:            __________________________',620,684,475,44,21,white);
 txt(s,'Руководитель: __________________________',620,733,475,44,21,white);
 txt(s,'Город, год: __________________',50,788,460,35,18,white);
}
// Цель и задачи.
{
 const s=page('Цель и задачи работы',2);
 txt(s,'Цель',70,183,160,35,25,blue,true);
 txt(s,'Разработать веб-систему для просмотра сведений о фильмах, сеансах, залах и проданных билетах',70,224,1000,92,30,ink,true);
 txt(s,'Задачи',70,351,250,36,25,blue,true);
 box(s,'01  Проектирование','Определить сущности и связи базы данных',70,410,475,115);
 box(s,'02  Данные','Создать таблицы MySQL и заполнить их примерами',600,410,480,115);
 box(s,'03  Сервер','Реализовать получение данных из MySQL',70,550,475,115);
 box(s,'04  Интерфейс','Показать каталог, сеансы и отчёт по жанру',600,550,480,115);
}
// Актуальность.
{
 const s=page('Актуальность темы',3);
 txt(s,'Сведения о работе кинотеатра связаны между собой',70,185,980,75,31,blue,true);
 box(s,'Единая структура','Фильмы, залы, сеансы и продажи хранятся в связанных таблицах.',70,296,1005,116);
 box(s,'Быстрый просмотр','Сайт собирает сведения из базы и показывает их в понятном виде.',70,438,1005,116);
 box(s,'Отчёт по жанру','Пользователь выбирает жанр и получает соответствующий список фильмов.',70,580,1005,116);
}
// Проектирование БД: схема связей редактируемая.
{
 const s=page('Проектирование базы данных',4);
 txt(s,'Таблицы и основные связи',70,165,1000,42,27,blue,true,'center');
 const centers=[110,342,574,806,1038];
 const names=[['genres','Жанры'],['movie_genres','Жанры фильмов'],['movies','Фильмы'],['sessions','Сеансы'],['tickets','Билеты']];
 const attrs=[['id (PK)','name'],['movie_id (PK, FK)','genre_id (PK, FK)'],['id (PK)','title'],['id (PK)','starts_at'],['id (PK)','session_id (FK)']];
 const connector=(x1,y1,x2,y2)=>s.shapes.add({geometry:'line',position:{left:Math.min(x1,x2),top:Math.min(y1,y2),width:Math.max(1,Math.abs(x2-x1)),height:Math.max(1,Math.abs(y2-y1))},fill:'none',line:{style:'solid',fill:'#41586b',width:2}});
 const figure=(kind,x,y,w,h,fill)=>s.shapes.add({geometry:kind,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:'#41586b',width:2}});
 for(let i=0;i<5;i++){
  const c=centers[i]; connector(c,275,c,445);
  for(let k=0;k<2;k++){figure('ellipse',c-75,242+k*67,150,47,'#e4eef9');txt(s,attrs[i][k],c-69,246+k*67,138,39,14,ink,true,'center');}
  figure('rect',c-78,445,156,80,'#d7eed2');txt(s,names[i][0]+'\n'+names[i][1],c-72,451,144,67,16,ink,true,'center');
 }
 for(let i=0;i<4;i++){
  const left=centers[i]+78,right=centers[i+1]-78,mid=(left+right)/2;connector(left,485,right,485);
  figure('diamond',mid-24,461,48,48,'#fff0c6');
  txt(s,i===1?'N':'1',left+2,449,22,25,14,ink,true,'center');txt(s,i===1?'1':'N',right-23,449,22,25,14,ink,true,'center');
 }
 connector(806,525,806,703);figure('diamond',779,577,54,54,'#fff0c6');
 txt(s,'N',821,535,25,24,14,ink,true);txt(s,'1',821,675,25,24,14,ink,true);
 figure('rect',728,703,156,66,'#d7eed2');txt(s,'halls\nЗалы',735,708,142,55,16,ink,true,'center');
 txt(s,'Фильм и жанр связаны через movie_genres. Поля и типы полностью показаны на отдельной схеме.',40,794,1040,30,16,gray,false,'center');
}
// Архитектура.
{
 const s=page('Клиент-серверная архитектура',5);
 txt(s,'Компоненты системы',70,180,1020,45,29,blue,true);
 const parts=[['БРАУЗЕР','HTML, CSS и JavaScript\nОтображение информации'],['СЕРВЕР','Node.js и HTTP API\nОбработка запросов'],['БАЗА ДАННЫХ','MySQL\nХранение и выборка данных']];
 for(let i=0;i<3;i++){let x=54+i*370; shape(s,x,320,305,190,pale,blue,2);txt(s,parts[i][0],x+15,340,275,35,22,blue,true,'center');txt(s,parts[i][1],x+15,390,275,85,21,ink,false,'center'); if(i<2) txt(s,'→',x+310,380,55,60,34,blue,true,'center');}
 txt(s,'Данные добавляются и изменяются непосредственно в MySQL. Веб-интерфейс предназначен для просмотра.',75,620,1000,80,24,ink,false,'center');
}
// Стек.
{
 const s=page('Технологический стек',6);
 box(s,'MySQL и SQL','Таблицы, связи, ограничения и запросы к данным.',70,240,480,180);
 box(s,'Node.js','HTTP-сервер и обработка запросов браузера.',602,240,480,180);
 box(s,'mysql2','Библиотека подключения сервера Node.js к MySQL.',70,458,480,180);
 box(s,'HTML, CSS, JavaScript','Структура, оформление и работа интерфейса.',602,458,480,180);
 txt(s,'Для установки зависимости и запуска проекта используется npm.',70,703,1012,45,22,gray,false,'center');
}
// Экранные примеры.
{
 const s=page('Результат работы',7);
 txt(s,'Веб-интерфейс «Киноучёт»',70,169,1012,42,28,blue,true,'center');
 await picture(s,'home',56,225,1040,536); small(s,'На скриншоте показаны демонстрационные данные из учебного набора.');
}
{
 const s=page('Список фильмов',8);
 await picture(s,'movies',35,185,740,560);
 txt(s,'Карточка фильма',806,210,290,44,26,blue,true);
 txt(s,'Название и описание\n\nГод и возрастное ограничение\n\nЖанры и длительность',806,275,290,360,23,ink);
 small(s,'Демонстрационный каталог: 5 фильмов.');
}
{
 const s=page('Отчёт по жанрам',9);
 txt(s,'Выбор жанра формирует список подходящих фильмов',65,172,1020,45,27,blue,true,'center');
 await picture(s,'report',55,235,1040,520);
 small(s,'Пример: жанр «Фантастика», 3 фильма из учебного набора.');
}
{
 const s=page('Сеансы и продажи билетов',10);
 await picture(s,'sessions',65,177,1022,305);
 await picture(s,'sales',65,478,1022,290);
 small(s,'Примеры сеансов и продаж. Даты на скриншоте демонстрационные.');
}
// Заключение.
{
 const s=page('Заключение',11);
 txt(s,'В ходе курсовой работы',75,185,1000,42,30,blue,true);
 const items=['Спроектирована реляционная база данных кинотеатра.', 'Созданы таблицы фильмов, жанров, залов, сеансов и билетов.', 'Реализовано получение данных из MySQL через сервер Node.js.', 'Разработаны каталог и отчёт по выбранному жанру.', 'Добавлены разделы для просмотра сеансов, залов и продаж.'];
 items.forEach((t,i)=>{shape(s,75,258+i*87,9,56,blue);txt(s,t,102,252+i*87,970,68,24,ink);});
 txt(s,'Данные заполняются напрямую в MySQL.',75,740,1000,48,23,gray,false,'center');
}
{
 const s=page('Завершение',12); txt(s,'Спасибо за внимание',80,320,992,100,49,blue,true,'center');
 txt(s,'Курсовая работа по разработке информационной системы кинотеатра',150,455,852,75,24,gray,false,'center');
}

for (let i=0;i<ppt.slides.items.length;i++) {
 const blob=await ppt.export({slide:ppt.slides.items[i],format:'png',scale:0.8});
 await fs.writeFile(path.join(build,`slide-${i+1}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const candidate=path.join(build,'candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidate);
const result=await finalizePresentation({workspaceDir:workspace,candidatePath:candidate,finalPath:output,pythonExecutable:'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','10972800,8229600'],explicitTotalSlideCount:12,verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-schema.json')});
console.log(JSON.stringify(result));
