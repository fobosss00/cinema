const { chromium } = require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const target = path.join(process.cwd(), '.presentation_build', 'screens');
fs.mkdirSync(target, {recursive:true});
async function main() {
  let browser;
  try {
    browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const movies = [
      {id:1,title:'Интерстеллар',description:'Экспедиция отправляется на поиски нового дома для человечества.',duration_minutes:169,release_year:2014,age_rating:'12+',genres:'Драма, Приключения, Фантастика'},
      {id:2,title:'Марсианин',description:'Астронавт пытается выжить на Марсе после неудачной экспедиции.',duration_minutes:144,release_year:2015,age_rating:'16+',genres:'Приключения, Фантастика'},
      {id:3,title:'1+1',description:'История дружбы двух очень разных людей.',duration_minutes:112,release_year:2011,age_rating:'16+',genres:'Драма, Комедия'},
      {id:4,title:'ВАЛЛ·И',description:'Маленький робот отправляется в большое космическое путешествие.',duration_minutes:98,release_year:2008,age_rating:'6+',genres:'Анимация, Приключения, Фантастика'},
      {id:5,title:'Приключения Паддингтона',description:'Медвежонок приезжает в Лондон и знакомится с новой семьёй.',duration_minutes:95,release_year:2014,age_rating:'6+',genres:'Комедия, Приключения'}
    ];
    const genres=[{id:1,name:'Фантастика',description:'Фильмы о возможном будущем, космосе и необычных технологиях.'},{id:2,name:'Драма'},{id:3,name:'Приключения'},{id:4,name:'Комедия'},{id:5,name:'Анимация'}];
    const sessions=[{movie_title:'Интерстеллар',hall_name:'Большой зал',starts_at:'2026-11-18 15:00:00',ticket_price:450,capacity:120,sold_count:2},{movie_title:'Марсианин',hall_name:'Большой зал',starts_at:'2026-11-18 19:00:00',ticket_price:400,capacity:120,sold_count:1},{movie_title:'1+1',hall_name:'Малый зал',starts_at:'2026-11-19 17:00:00',ticket_price:350,capacity:48,sold_count:1}];
    const halls=[{name:'Большой зал',rows_count:10,seats_per_row:12,capacity:120},{name:'Малый зал',rows_count:6,seats_per_row:8,capacity:48}];
    const sales=[{movie_title:'Интерстеллар',hall_name:'Большой зал',starts_at:'2026-11-18 15:00:00',row_number:4,seat_number:5,price:450,sold_at:'2026-11-17 12:00:00'},{movie_title:'Марсианин',hall_name:'Большой зал',starts_at:'2026-11-18 19:00:00',row_number:2,seat_number:3,price:400,sold_at:'2026-11-17 12:00:00'}];
    await page.route('**/api?*',async route=>{const resource=new URL(route.request().url()).searchParams.get('resource'); const result=resource==='report'?{genre:genres[0],data:movies.filter(m=>m.genres.includes('Фантастика'))}:{data:({movies,genres,sessions,halls,sales})[resource]||[]}; await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});});
    await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
    console.log('Error:', await page.locator('#error').innerText().catch(()=>''));
    await page.screenshot({path:path.join(target,'home.png')});
    for (const [id,name] of [['#movies','movies'],['#sessions','sessions'],['#halls','halls'],['#sales','sales']]) {
      await page.locator(id).screenshot({path:path.join(target,name+'.png')});
    }
    await page.locator('#genre-select').selectOption({label:'Фантастика'});
    await page.locator('#report-form button').click();
    await page.waitForSelector('.result-heading');
    await page.locator('#report').screenshot({path:path.join(target,'report.png')});
    console.log('Скриншоты готовы.');
  } finally { if(browser) await browser.close(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
