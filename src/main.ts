import Phaser from 'phaser';
import './style.css';
import BenchmarkScene from './BenchmarkScene';
import player0 from './assets/player/player-0.png';
import player1 from './assets/player/player-1.png';
import player2 from './assets/player/player-2.png';
import player3 from './assets/player/player-3.png';
import player4 from './assets/player/player-4.png';
import player5 from './assets/player/player-5.png';
import player6 from './assets/player/player-6.png';
import player7 from './assets/player/player-7.png';
import zombie0 from './assets/zombie/zombie-0.png';
import zombie1 from './assets/zombie/zombie-1.png';
import zombie2 from './assets/zombie/zombie-2.png';
import zombie3 from './assets/zombie/zombie-3.png';
import zombie4 from './assets/zombie/zombie-4.png';
import zombie5 from './assets/zombie/zombie-5.png';
import zombie6 from './assets/zombie/zombie-6.png';
import zombie7 from './assets/zombie/zombie-7.png';
import explosion0 from './assets/explosion/explosion-0.png';
import explosion1 from './assets/explosion/explosion-1.png';
import explosion2 from './assets/explosion/explosion-2.png';
import explosion3 from './assets/explosion/explosion-3.png';
import explosion4 from './assets/explosion/explosion-4.png';
import explosion5 from './assets/explosion/explosion-5.png';
import explosion6 from './assets/explosion/explosion-6.png';
import explosion7 from './assets/explosion/explosion-7.png';
import benchmarkStreet from './assets/benchmark-street.png';
import cityCentreArt from './assets/city-centre-arcade.png';
import cityHallArt from './assets/city-hall-arcade.png';
import streetWest from './assets/street-west.png';
import streetEast from './assets/street-east.png';
import centreWest from './assets/city-centre-west.png';
import centreEast from './assets/city-centre-east.png';
import hallWest from './assets/city-hall-west.png';
import boss0 from './assets/boss-0.png';
import boss1 from './assets/boss-1.png';
import boss2 from './assets/boss-2.png';
import boss3 from './assets/boss-3.png';
import platformTaxi from './assets/platform-taxi.png';
import platformShelter from './assets/platform-shelter.png';
import platformWall from './assets/platform-wall.png';
import wetAsphaltArt from './assets/belfast-wet-asphalt.png';
import ResidentialScene from './ResidentialScene';

const W=480,H=270, WORLD=4980, FLOOR=225;
const RESIDENTIAL_END=1450;
const V5_BENCHMARK=new URLSearchParams(location.search).get('benchmark')==='v5';
// Vehicle landmarks use image-local coordinates; the collision shape derives
// from the same landmarks so visual and physics roof anchors cannot drift.
export const V5_TAXI_ART_ANCHORS = Object.freeze({
 width:120,height:58,ground:{x:60,y:58},deck:{left:25,right:87,y:18},
});
const PLATFORM_ROOFS={
 'platform-shelter':{centerOffsetX:0,topOffsetY:-31,width:78},
 'platform-wall':{centerOffsetX:0,topOffsetY:-22,width:86}
} as const;
const playerFrames=[player0,player1,player2,player3,player4,player5,player6,player7];
const zombieFrames=[zombie0,zombie1,zombie2,zombie3,zombie4,zombie5,zombie6,zombie7];
const explosionFrames=[explosion0,explosion1,explosion2,explosion3,explosion4,explosion5,explosion6,explosion7];
const bossFrames=[boss0,boss1,boss2,boss3];

type AnySprite = Phaser.Physics.Arcade.Sprite;

function canvasTex(scene:Phaser.Scene,key:string,width:number,height:number,draw:(ctx:CanvasRenderingContext2D)=>void){
 const t=scene.textures.createCanvas(key,width,height)!; const c=t.getContext(); c.imageSmoothingEnabled=false; draw(c); t.refresh(); return t;
}
function box(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,col:string){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function building(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,style:number){
 const brick=style%2?'#65443c':'#75473e', mortar='#a77a64';
 box(ctx,x+5,y+5,w,h,brick); box(ctx,x+2,y,w-4,5,'#b1826a'); box(ctx,x,y+4,4,h-4,'#c19b77'); box(ctx,x+w-4,y+4,4,h-4,'#493b37');
 for(let yy=y+16;yy<y+h-10;yy+=7){box(ctx,x+5,yy,w-10,1,mortar); for(let xx=x+7+(yy%14?0:9);xx<x+w-8;xx+=19)box(ctx,xx,yy-3,1,4,mortar);}
 box(ctx,x+w*.40,y-10,w*.20,10,'#403935'); box(ctx,x+w*.36,y-13,w*.28,3,'#bd9270');
 for(let wx=x+10;wx<x+w-10;wx+=15){
   for(let wy=y+17;wy<y+h-28;wy+=18){box(ctx,wx,wy,9,11,'#c0aa83');box(ctx,wx+2,wy+2,5,7,'#243439');box(ctx,wx+4,wy+2,2,7,style%2?'#d5a55d':'#728b82');box(ctx,wx-1,wy+10,11,2,'#d3c39c');box(ctx,wx+4,wy,1,11,'#86755d');}
 }
 box(ctx,x+w*.39,y+h-26,w*.22,26,'#302a28');box(ctx,x+w*.47,y+h-22,w*.06,1,'#d8a24f');
 if(style%3===0){box(ctx,x+w*.28,y-18,w*.44,6,'#e6d3a5');box(ctx,x+w*.31,y-17,w*.38,4,'#554239');for(let i=0;i<4;i++)box(ctx,x+w*.34+i*7,y-16,4,2,i%2?'#e6c78d':'#df5e48');}
}
function spriteDraw(ctx:CanvasRenderingContext2D,kind:string,frame:number=0){
 const bob=frame%2, leg=frame%3;
 if(kind==='player'){
  // shadow, boots, utility trousers, jacket and head scarf; 24x32 canvas
  box(ctx,4,28,17,3,'#111717'); box(ctx,6,25,6,4,'#24282a');box(ctx,15,25+(leg===1?2:0),6,4,'#25292a');
  box(ctx,7,18+bob,5,8,'#555c50');box(ctx,14,18-bob,5,8,'#4b5349');box(ctx,7,22+bob,5,2,'#313735');box(ctx,14,22-bob,6,2,'#303735');
  box(ctx,6,10+bob,14,10,'#52605a');box(ctx,5,11+bob,4,9,'#39443f');box(ctx,17,12+bob,5,7,'#4d5851');box(ctx,8,12+bob,9,2,'#788074');
  box(ctx,8,7,11,7,'#c69872');box(ctx,7,5,12,4,'#dbd1b7');box(ctx,6,4,14,3,'#798273');box(ctx,10,8,2,2,'#161b1b');box(ctx,16,8,2,2,'#171c1b');box(ctx,17,12,2,2,'#b04c3d');
  box(ctx,20,12,4,3,'#252829');box(ctx,21,11,3,2,'#d5a351');
 } else if(kind==='shambler'||kind==='runner'||kind==='spitter'){
  const run=kind==='runner', spit=kind==='spitter';box(ctx,3,29,19,2,'#111719');
  box(ctx,5,25+(leg===1?1:0),7,4,'#343a35');box(ctx,14,25+(leg===2?1:0),7,4,'#363b37');
  box(ctx,6,15+bob,7,11,'#65745e');box(ctx,14,16-bob,7,10,'#58644f');box(ctx,6,19+bob,14,8,run?'#66775a':'#57684f');
  box(ctx,5,11+bob,15,11,spit?'#72795b':'#68765c');box(ctx,4,12+bob,5,7,'#626d54');box(ctx,18,13+bob,4,8,'#54644e');
  box(ctx,7,5,12,10,'#79816b');box(ctx,8,4,10,4,'#767d68');box(ctx,8,8,3,3,'#d0c998');box(ctx,15,8,3,3,'#cfcb91');box(ctx,9,9,2,2,'#a9463a');box(ctx,16,9,2,2,'#a44138');
  box(ctx,10,13,8,2,'#4b3931');box(ctx,11,13,2,1,'#e2d2ae');box(ctx,16,14,4,2,'#a44f3f');
  if(spit){box(ctx,14,19,8,5,'#9c8661');box(ctx,17,20,7,3,'#be9d6b');}
  if(run){box(ctx,2,18,4,2,'#8c5341');box(ctx,5,21,3,2,'#ad5743');}
 }
}

class Boot extends Phaser.Scene {
 constructor(){super('Boot');}
 preload(){
  playerFrames.forEach((url,i)=>this.load.image(`arc-player-${i}`,url));
  zombieFrames.forEach((url,i)=>this.load.image(`arc-zombie-${i}`,url));
  explosionFrames.forEach((url,i)=>this.load.image(`arc-blast-${i}`,url));
  this.load.image('street-art',benchmarkStreet);this.load.image('city-centre-art',cityCentreArt);this.load.image('city-hall-art',cityHallArt);
  this.load.image('street-west',streetWest);this.load.image('street-east',streetEast);this.load.image('centre-west',centreWest);this.load.image('centre-east',centreEast);this.load.image('hall-west',hallWest);
  bossFrames.forEach((url,i)=>this.load.image(`arc-boss-${i}`,url));
  this.load.image('platform-taxi',platformTaxi);this.load.image('platform-shelter',platformShelter);this.load.image('platform-wall',platformWall);
  this.load.image('wet-asphalt',wetAsphaltArt);
 }
 create(){
  const s=this;
  if(!this.anims.exists('arc-blast'))this.anims.create({key:'arc-blast',frames:explosionFrames.map((_,i)=>({key:`arc-blast-${i}`})),frameRate:22,repeat:0});
  for(const kind of ['player','shambler','runner','spitter']) for(let f=0;f<4;f++) canvasTex(s,`${kind}-${f}`,24,32,c=>spriteDraw(c,kind,f));
  canvasTex(s,'bullet',7,3,c=>{box(c,0,1,7,1,'#fff1ad');box(c,2,0,3,3,'#ed9d44');});
  canvasTex(s,'acid',7,5,c=>{box(c,1,1,5,3,'#9bd18c');box(c,2,0,3,5,'#c1d877');});
  canvasTex(s,'grenade',8,8,c=>{box(c,2,1,5,6,'#7b8065');box(c,1,2,6,4,'#9ca17a');box(c,3,0,3,2,'#dbbb70');});
  canvasTex(s,'heart',9,8,c=>{box(c,1,1,3,2,'#c84b3a');box(c,5,1,3,2,'#c84b3a');box(c,1,2,7,3,'#e46043');box(c,2,5,5,2,'#ba392e');box(c,3,7,3,1,'#852c28');});
  for(let f=0;f<7;f++) canvasTex(s,`fire-${f}`,24,24,c=>{box(c,9-f%3,11-f,6+f%2,6+f,'#d95134');box(c,11,9-f,3,8+f,'#f0c35d');box(c,12,12-f,2,4,'#fff0af');});
  for(let f=0;f<4;f++) canvasTex(s,`smoke-${f}`,16,16,c=>{for(let i=0;i<8;i++){const x=2+(i*7+f*3)%11,y=2+(i*5+f*4)%11;box(c,x,y,2,2,['#61706a','#899086','#475a5b'][i%3]);}});
  canvasTex(s,'scenery',WORLD,270,c=>drawScenery(c));
  canvasTex(s,'hall',400,190,c=>drawCityHall(c));
  canvasTex(s,'boss-sky',WORLD,270,c=>drawSky(c));
  const wetAsphalt=s.textures.get('wet-asphalt').getSourceImage() as CanvasImageSource;
  canvasTex(s,'street-surface',WORLD,59,c=>drawStreetSurface(c,wetAsphalt));
  composeBackdrop(s);
  const benchmark=new URLSearchParams(location.search).get('benchmark');
  this.scene.start(benchmark==='v5'?'Game':benchmark==='v7'||benchmark==='v7.1'?'ResidentialScene':benchmark?'Benchmark':'Title');
 }
}
function drawStreetSurface(c:CanvasRenderingContext2D,wetAsphalt:CanvasImageSource){
 // A single 1px-scale street plate runs under every backdrop panel so the road,
 // kerb and gutter never jump at section boundaries. Colours borrow the wet
 // blue-green asphalt and warm stone light used by the original Belfast art.
 const g=c.createLinearGradient(0,0,0,59);g.addColorStop(0,'#b6a985');g.addColorStop(.12,'#716d5b');g.addColorStop(.22,'#505751');g.addColorStop(.32,'#343e3d');g.addColorStop(1,'#202d30');c.fillStyle=g;c.fillRect(0,0,WORLD,59);
 const hash=(n:number)=>{let v=(n*1664525+1013904223)>>>0;v^=v>>>16;return v/4294967296;};
 // Worn Belfast flagstone, a deep drainage seam, and irregular kerb joints.
 for(let x=0;x<WORLD;x+=8){const n=hash(x);box(c,x,1,7,1,n>.7?'#cabd94':n>.35?'#9a9478':'#797760');box(c,x,2,1,4,'#625f52');if(n>.65)box(c,x+2,5,3,1,'#c0b38d');if(V5_BENCHMARK&&x<RESIDENTIAL_END&&n>.88)box(c,x+5,3,2,1,'#b8a783');}
 box(c,0,7,WORLD,1,'#d5c69b');box(c,0,8,WORLD,4,'#776f5b');box(c,0,8,WORLD,1,'#b7a982');box(c,0,12,WORLD,2,'#2d3635');box(c,0,14,WORLD,45,'#293537');
 for(let x=0;x<WORLD;x+=15){const n=hash(x+47);box(c,x,9,13,3,n>.55?'#9b9271':'#867f66');box(c,x+12,9,1,3,'#554f44');if(V5_BENCHMARK&&x<RESIDENTIAL_END&&n>.72)box(c,x+3,10,5,1,'#b0a580');}
 // One original painted wet-asphalt plate replaces the old flat slab. It spans
 // the whole journey, so road material and reflection patterns do not tile at
 // the neighbourhood transitions.
 c.imageSmoothingEnabled=false;c.drawImage(wetAsphalt,0,14,WORLD,45);
 // Lane paint changes in length and wear through the route; residential marks
 // sit between vehicle platforms and the hand-painted road drains.
 if(V5_BENCHMARK){
  const dashes=[76,382,678,986,1288,1620,1910,2226,2528,2830,3136,3442,3748,4050,4356,4662];
  for(const x of dashes){const w=x<1450?50+(x%3)*7:66;box(c,x,35,w,2,'#89866f');box(c,x+2,35,w-8,1,'#b2a685');for(let j=0;j<Math.floor(w/9);j++)box(c,x+8+j*9,36,4,1,'#646d66');box(c,x+w-5,35,4,1,'#6f776b');}
 }else for(let x=76;x<WORLD;x+=306){box(c,x,35,66,2,'#89866f');box(c,x+2,35,58,1,'#b2a685');for(let j=0;j<6;j++)box(c,x+10+j*8,36,4,1,'#646d66');box(c,x+61,35,4,1,'#6f776b');}
 // V5 residential road treatment: pothole repairs, rain-slick patches and
 // short reflected curb-light streaks preserve the continuous wet-road plate.
 const repairs:Array<[number,number,number,number]>=[[174,46,34,5],[512,52,27,3],[742,22,21,4],[1038,48,39,4],[1230,21,18,3]];
 for(const [x,y,w,h] of repairs){box(c,x,y,w,h,'#1b292b');box(c,x+2,y+1,w-5,1,'#3d4c4b');box(c,x+5,y+h-1,w-10,1,'#687169');}
 if(V5_BENCHMARK)for(let i=0;i<30;i++){const x=36+(i*137%1370),y=19+(i*17%30),w=3+(i%7);box(c,x,y,w,1,i%3?'#718079':'#ba925e');if(i%4===0)box(c,x+w-1,y+1,2,1,'#3b5553');}
 // Belfast street iron: paired storm drains and occasional manhole covers.
 for(const x of (V5_BENCHMARK?[205,920,1388,1512,2185,3030,3770,4510]:[205,920,1450,2185,3030,3770,4510])){box(c,x,17,20,7,'#202729');box(c,x+1,18,18,1,'#657065');for(let j=0;j<7;j++)box(c,x+3+j*2,19,1,4,'#87907b');box(c,x+1,24,18,1,'#161e20');}
 for(let x=370;x<WORLD;x+=907){box(c,x,42,18,6,'#1a2426');box(c,x+1,42,16,1,'#64716e');box(c,x+2,44,12,1,'#344c4b');box(c,x+2,47,12,1,'#111b1c');for(let j=0;j<6;j++)box(c,x+4+j*2,43,1,4,'#798176');}
 // The residential side street meets the playable road at x=1450. Cut the
 // kerb at the crossing, flare the stone ramps and carry the alley's wet sheen
 // into the playable surface so the two planes read as one junction.
 const residentialJunction=1224;
 box(c,residentialJunction-15,7,30,6,'#202b2c');
 c.fillStyle='#b3a27c';c.beginPath();c.moveTo(residentialJunction-34,8);c.lineTo(residentialJunction-15,8);c.lineTo(residentialJunction-15,14);c.lineTo(residentialJunction-28,14);c.closePath();c.fill();
 c.beginPath();c.moveTo(residentialJunction+34,8);c.lineTo(residentialJunction+15,8);c.lineTo(residentialJunction+15,14);c.lineTo(residentialJunction+28,14);c.closePath();c.fill();
 box(c,residentialJunction-33,13,66,44,'#232f31');box(c,residentialJunction-33,14,66,1,'#66736c');
 for(let j=0;j<6;j++){const x=residentialJunction-28+j*11;box(c,x,28,6,15,'#b5ab8a');box(c,x,28,6,1,'#ddd0aa');box(c,x,41,6,1,'#777d70');}
 for(let y=16;y<54;y+=9){box(c,residentialJunction-4,y,2,4,'#a78a5c');box(c,residentialJunction+2,y+2,1,3,'#71827b');}
 // A secondary cross-street farther ahead keeps the older city-centre crossing.
 const crossingCenters=V5_BENCHMARK?[3030]:[1450,3030];
 for(const center of crossingCenters){box(c,center-34,14,68,43,'#232f31');box(c,center-34,14,68,1,'#394444');
  for(let j=0;j<5;j++){box(c,center-29+j*13,29,7,13,'#9d9a7d');box(c,center-29+j*13,29,7,1,'#c3bb99');box(c,center-29+j*13,41,7,1,'#69746b');}
  box(c,center-39,27,3,18,'#bcad84');box(c,center+36,27,3,18,'#bcad84');}
}
function composeBackdrop(scene:Phaser.Scene){
 const tex=scene.textures.createCanvas('game-panorama',WORLD,H)!;const ctx=tex.getContext();
 // The opening street uses distinct original painted Belfast scenes. Their
 // lower street lines align with the continuous playable road below.
 const panels:[string,number,number][] = V5_BENCHMARK
  ?[['street-east',0,480],['centre-east',480,480],['city-centre-art',960,480],['centre-west',1440,480],['centre-east',1920,480],['city-centre-art',2400,480],['city-centre-art',2880,480],['hall-west',3360,480],['hall-west',3520,480],['city-hall-art',4000,480],['city-hall-art',4480,500]]
  :[['street-west',0,480],['street-east',480,480],['street-art',960,480],['centre-west',1440,480],['centre-east',1920,480],['city-centre-art',2400,480],['city-centre-art',2880,480],['hall-west',3360,480],['hall-west',3520,480],['city-hall-art',4000,480],['city-hall-art',4480,500]];
 for(let i=0;i<panels.length;i++){
  const [key,x,width]=panels[i]!;
  if(V5_BENCHMARK&&key==='residential-junction'){drawResidentialJunction(ctx,x);continue;}
  const image=scene.textures.get(key).getSourceImage() as CanvasImageSource;
  if(i===0){ctx.drawImage(image,0,0,width,H);continue;}
  // Hard segment boundaries preserve the painted architecture. The prior
  // broad crossfade doubled windows and rooflines where the art did not match.
  ctx.imageSmoothingEnabled=false;
  if(V5_BENCHMARK&&key==='centre-east'&&x===480){
   // Its far-left taxi is outside this street view; crop it cleanly so only
   // the distant church and shelter remain as the residential street opens up.
   ctx.drawImage(image,28,0,width-28,H,x,0,width,H);
  }else if(V5_BENCHMARK)ctx.drawImage(image,x,0,width,H);
  else{
   const edge=28,scratch=document.createElement('canvas');scratch.width=width;scratch.height=H;
   const part=scratch.getContext('2d')!;part.imageSmoothingEnabled=false;part.drawImage(image,0,0,width,H);
   const mask=document.createElement('canvas');mask.width=width;mask.height=H;const m=mask.getContext('2d')!;
   const fade=m.createLinearGradient(0,0,edge,0);fade.addColorStop(0,'rgba(255,255,255,0)');fade.addColorStop(1,'rgba(255,255,255,1)');m.fillStyle=fade;m.fillRect(0,0,edge,H);m.fillStyle='#fff';m.fillRect(edge,0,width-edge,H);
   part.globalCompositeOperation='destination-in';part.drawImage(mask,0,0);part.globalCompositeOperation='source-over';ctx.drawImage(scratch,x,0,width,H);
  }
 }
 tex.refresh();
}
function drawResidentialJunction(c:CanvasRenderingContext2D,ox:number){
 const b=(x:number,y:number,w:number,h:number,col:string)=>box(c,ox+x,y,w,h,col);
 const sky=c.createLinearGradient(0,0,0,205);sky.addColorStop(0,'#142a39');sky.addColorStop(.56,'#33444a');sky.addColorStop(1,'#6b695d');c.fillStyle=sky;c.fillRect(ox,0,480,220);
 // Distant roofline and the warm windows of the next Belfast terrace.
 for(let x=0;x<480;x+=31){const h=23+(x*17%37);b(x,157-h,27,h,'#344448');for(let wx=x+4;wx<x+24;wx+=10){b(wx,164-h,4,7,(wx+x)%3?'#b58c56':'#657c77');}}
 b(6,126,467,2,'#19282c');
 for(let x=17;x<470;x+=73){b(x,125,2,35,'#263238');b(x-3,124,8,2,'#374347');}
 // Three deliberately different frontages: a gabled terrace, a boarded end
 // house, and a corner shop whose blank brick return frames the side street.
 const house=(x:number,w:number,top:number,variant:number)=>{
  b(x+3,top+4,w-6,195-top,'#201f20');b(x,top+8,w,187-top,variant%2?'#713f38':'#82483d');
  b(x-2,top+7,w+4,5,'#ad795e');b(x+2,top+13,3,179-top,'#bd9070');b(x+w-5,top+13,3,179-top,'#4e3935');
  // Guttered slate roof with a clipped gable and a sooty chimney.
  c.fillStyle='#26353c';c.beginPath();c.moveTo(ox+x-3,top+9);c.lineTo(ox+x+w*.5,top-15);c.lineTo(ox+x+w+3,top+9);c.closePath();c.fill();
  c.fillStyle='#3e4a49';c.beginPath();c.moveTo(ox+x+5,top+7);c.lineTo(ox+x+w*.5,top-9);c.lineTo(ox+x+w-5,top+7);c.closePath();c.fill();
  for(let yy=top-4;yy<top+6;yy+=4)for(let xx=x+8;xx<x+w-8;xx+=9){b(xx,yy,7,1,'#63706a');if((xx+yy)%3===0)b(xx+4,yy+1,2,1,'#202e33');}
  b(x+5,top+3,w-10,3,'#324047');b(x+11,top-2,w-22,3,'#29383f');
  b(x+Math.floor(w*.23),top-8,5,11,'#723f38');b(x+Math.floor(w*.23)-2,top-9,9,2,'#b28569');
  for(let yy=top+20;yy<top+150;yy+=13){
   b(x+5,yy,w-10,1,'#a46c57');
   for(let xx=x+8+(yy%26?0:9);xx<x+w-10;xx+=16)b(xx,yy-5,1,5,'#352c2c');
  }
  // Varied chips in the brick face keep each terrace from reading as a flat
  // repeated rectangle at the game's one-pixel scene scale.
  for(let i=0;i<180;i++){
   const xx=x+5+(i*37+variant*19)%(w-10),yy=top+15+(i*23+variant*11)%(174-top);
   if(yy<top+151)b(xx,yy,1+(i%3),1,i%4===0?'#b27459':i%3===0?'#523936':'#8d5143');
  }
  for(let row=0;row<3;row++)for(let col=0;col<Math.max(1,Math.floor((w-23)/24));col++){
   const wx=x+10+col*24+(row%2?3:0),wy=top+22+row*35;
   b(wx,wy,13,18,'#d2c19a');b(wx+2,wy+2,9,14,variant===1&&row===1?'#273438':'#324348');
   b(wx+5,wy+2,2,14,variant%2?'#b47d4b':'#7f957d');b(wx-1,wy+17,15,3,'#d1bd91');
   if((wx+row)%3===0)b(wx+6,wy+5,3,4,'#e7ae56');
  }
  b(x+Math.floor(w*.42),top+150,Math.floor(w*.20),45,'#292725');
  b(x+Math.floor(w*.42)+4,top+154,Math.floor(w*.20)-8,41,'#203638');
  b(x+7,top+9,2,171-top,'#473a37');b(x+w-9,top+9,2,171-top,'#a06c58');
  if(variant===1){b(x+12,top+91,15,17,'#302c2a');b(x+14,top+93,11,13,'#4a4440');b(x+10,top+108,19,2,'#bd9c71');}
 };
 house(0,132,47,0);house(132,124,65,1);
 // Narrow shopfront at the corner; no lettering is repeated from the V2 grocer.
 b(256,91,101,104,'#223234');b(253,86,105,7,'#b39069');b(258,95,96,3,'#d0b27c');
 b(262,103,42,53,'#bd9164');b(266,107,34,45,'#283b3c');b(308,103,44,53,'#b7a27c');b(312,107,36,45,'#263739');
 for(let y=113;y<149;y+=12){b(267,y,33,2,'#d2a75e');b(313,y,34,2,'#d0a15b');}
 b(257,157,96,5,'#a98662');b(258,164,95,31,'#643c34');
 for(let x=265;x<350;x+=14){b(x,167,8,24,'#304246');b(x+2,169,4,13,(x%3)?'#829083':'#d39a4f');}
 b(259,158,91,2,'#d2aa68');b(259,193,94,2,'#c49a64');
 // Door lamps and catches pick out the three-frontage rhythm in the rain.
 for(const x of [43,172,284,337]){b(x,154,2,14,'#272e2c');b(x-3,151,8,4,'#d89a49');b(x-2,152,6,2,'#f2c46f');}
 // Railings, gate posts and wet ivy break the brick silhouettes at pavement level.
 for(let x=7;x<248;x+=17){b(x,181,2,16,'#202a2b');b(x,181,7,1,'#7d735d');b(x+5,183,1,13,'#303737');}
 for(let i=0;i<70;i++){const x=5+(i*29%244),y=154+(i*17%34);b(x,y,2+(i%3),2,i%4===0?'#d3ad4e':i%2?'#324538':'#4d684a');}
 // Overhead wires and a warm street lamp bridge the image segment boundary.
 c.strokeStyle='#17242a';c.lineWidth=1;c.beginPath();c.moveTo(ox+3,55);c.quadraticCurveTo(ox+219,80,ox+476,49);c.stroke();
 c.beginPath();c.moveTo(ox+84,59);c.quadraticCurveTo(ox+265,92,ox+452,56);c.stroke();
 b(238,99,3,96,'#222d31');b(232,99,15,3,'#323c3a');b(235,93,9,6,'#d9a34e');b(237,94,5,4,'#f2c268');
 // Side-road opening recedes between brick returns. The lane aligns at the
 // right edge with the cross-street in the continuous playable road below.
 b(357,95,4,100,'#382e2b');b(465,84,5,111,'#43332d');
 c.fillStyle='#253437';c.beginPath();c.moveTo(ox+361,174);c.lineTo(ox+465,174);c.lineTo(ox+480,211);c.lineTo(ox+350,211);c.closePath();c.fill();
 c.fillStyle='#39474a';c.beginPath();c.moveTo(ox+374,166);c.lineTo(ox+453,166);c.lineTo(ox+480,211);c.lineTo(ox+350,211);c.closePath();c.fill();
 // Receding cobble glints and kerb cuts make the alley read as a road, not a
 // dark facade gap. The horizontal street plate starts at y=211 beneath it.
 for(let i=0;i<10;i++){const y=177+i*3.2,w=10+i*7,x=415-w/2;b(x,y,w,1,i%2?'#78806f':'#b08a58');}
 b(349,205,131,2,'#d0bc92');b(349,208,131,2,'#657269');
 // A small Belfast taxi sits in the far depth at half scale, grounded at the
 // alley mouth, well away from the foreground vehicle roof platforms.
 const tx=444,ty=173,s=.52;
 const sb=(x:number,y:number,w:number,h:number,col:string)=>b(tx+x*s,ty+y*s,w*s,h*s,col);
 sb(3,34,66,3,'#121a1b');sb(9,20,54,15,'#1a2224');sb(19,12,31,13,'#202a2c');
 sb(22,14,12,9,'#71817a');sb(36,14,11,9,'#a08b67');sb(7,30,58,5,'#47534f');
 sb(14,33,10,8,'#151a1b');sb(52,33,10,8,'#151a1b');sb(27,9,12,3,'#d0b879');
 // Rainlit reflections fade into the alley depth, distinct from the playable road.
 for(let i=0;i<22;i++){const x=354+(i*37%118),y=199+(i*11%10);b(x,y,5+(i%4)*3,1,i%3?'#54625e':'#a68b5a');}
}
function drawSky(c:CanvasRenderingContext2D){
 const g=c.createLinearGradient(0,0,0,270);g.addColorStop(0,'#182c35');g.addColorStop(.6,'#52605c');g.addColorStop(1,'#9a8a70');c.fillStyle=g;c.fillRect(0,0,WORLD,270);
 for(let x=0;x<WORLD;x+=13){box(c,x,(x*17)%74+14,1,25,'#87999044');}
 for(let x=0;x<WORLD;x+=170){const h=60+(x*11%40), w=80+(x*7%35);box(c,x,158-h,w,h,'#324447');for(let xx=x+6;xx<x+w;xx+=12)box(c,xx,166-h,5,5,'#b0a283');}
 // City Hall silhouette is repeated as a feature centered on finale
 const x=4250;box(c,x-50,96,280,87,'#384747');box(c,x-40,100,260,7,'#8d937c');
 for(let xx=x-35;xx<x+205;xx+=28){box(c,xx,112,15,50,'#625f51');box(c,xx+3,117,9,41,'#303c3c');box(c,xx-2,108,19,5,'#b4a680');}
 box(c,x+46,77,110,34,'#4f5350');box(c,x+51,73,100,6,'#baaa83');
 box(c,x+72,44,59,32,'#6a6657');box(c,x+78,37,47,8,'#c7b78a');box(c,x+94,13,14,24,'#b2a27f');box(c,x+98,0,6,15,'#d2bd8d');
 box(c,x+83,35,4,16,'#574f40');box(c,x+118,35,4,16,'#574f40');box(c,x+69,65,66,3,'#d7c18e');
 box(c,0,184,WORLD,86,'#34413d');
}
function drawCityHall(c:CanvasRenderingContext2D){
 // Belfast City Hall inspired by its broad Edwardian frontage, pale stone and copper dome.
 box(c,26,90,348,84,'#7e806f');box(c,20,84,360,9,'#d2c49a');box(c,32,93,336,7,'#c9bb91');
 box(c,54,60,292,25,'#a49b7d');box(c,46,54,308,8,'#d7c99f');box(c,75,42,250,12,'#b9ae89');
 // Wings and corner pavilions
 for(const side of [0,1]){const x=side?328:47;box(c,x,62,24,42,'#d4c79e');box(c,x-5,58,34,6,'#eee0b7');box(c,x+4,67,5,21,'#34494c');box(c,x+14,67,5,21,'#405657');box(c,x,88,24,4,'#988a6d');box(c,x+8,45,8,13,'#b8aa85');box(c,x+4,42,16,4,'#d9c99f');}
 // Main pediment with carved stone face and clock
 box(c,115,38,170,21,'#c9bd96');box(c,107,34,186,6,'#ede0b5');box(c,126,40,148,15,'#8e8c74');
 box(c,183,38,34,20,'#ddd0a4');box(c,188,42,24,13,'#52615d');box(c,191,45,18,7,'#d4bf89');box(c,199,46,2,5,'#675c49');box(c,198,45,5,1,'#665d4c');
 // Tall copper dome with drum, balustrade and lantern
 box(c,160,33,80,6,'#e5d8ac');box(c,169,26,62,7,'#b9b18a');box(c,176,18,48,9,'#9d9777');
 box(c,182,12,36,7,'#628076');box(c,187,7,26,6,'#66897e');box(c,192,2,16,6,'#779388');box(c,198,0,5,4,'#d6c292');
 for(let x=174;x<229;x+=8)box(c,x,26,3,4,'#ddd1a2');
 // Three storey window rhythm and columned central entry
 for(let y=67;y<160;y+=19){box(c,57,y,286,2,'#e4d7ae');for(let x=62;x<344;x+=20){box(c,x,y+3,11,12,'#415457');box(c,x+1,y+3,2,10,'#9ca78f');box(c,x-2,y+15,15,2,'#d2c49a');}}
 for(let x=142;x<263;x+=18){box(c,x,63,4,87,'#e6d7ad');box(c,x-1,61,6,4,'#f0e0b4');box(c,x-1,149,6,4,'#bcae86');}
 box(c,177,127,46,49,'#716e5a');box(c,184,128,32,47,'#202e30');box(c,193,132,14,43,'#79836f');box(c,177,125,46,5,'#dfd1a5');
 box(c,20,174,360,6,'#20292a');
}
function drawScenery(c:CanvasRenderingContext2D){
 const g=c.createLinearGradient(0,0,0,230);g.addColorStop(0,'#2b3d42');g.addColorStop(1,'#747467');c.fillStyle=g;c.fillRect(0,0,WORLD,230);
 // Distant chimney skyline and soft cloud bands
 for(let x=0;x<WORLD;x+=11){box(c,x,36+(x*13%27),1,1,'#c0c6aa');}
 for(let x=-12;x<WORLD;x+=122){const h=44+(x*7%34);box(c,x,178-h,90,h,'#415052');for(let wx=x+8;wx<x+83;wx+=15)box(c,wx,153-h,6,4,'#756f60');}
 for(let x=0;x<WORLD;x+=180){box(c,x+54,111,9,65,'#75534a');box(c,x+51,107,15,5,'#a27b63');box(c,x+52,117,12,3,'#ba8d6f');}
 // red-brick terraces and varied Belfast shopfronts
 for(let x=0;x<WORLD;){const w=68+(x*13%38), h=66+(x*11%26), y=178-h;building(c,x,y,w,h,Math.floor(x/79));x+=w+8;}
 // Shop signs, Ulster shop windows, boarded windows
 const signs=[['THE SLOAN','#d29c57'],['OFF-LICENCE','#6d8f7a'],['HILL STREET','#ad6549'],['NEWS & COFFEE','#b19862']];
 for(let x=360;x<WORLD;x+=390){const [label,col]=signs[Math.floor(x/390)%signs.length];box(c,x,166,60,14,'#302c29');box(c,x+2,167,56,9,col);c.fillStyle='#f0dfb5';c.font='bold 5px monospace';c.fillText(label,x+5,174);box(c,x+5,180,20,20,'#24363a');box(c,x+30,180,23,20,'#425752');box(c,x+4,179,51,2,'#d5bc8e');}
 // Belfast black taxi parked among wrecked cars
 for(const x of [510,1140,2040,3160]){
  box(c,x+4,216,57,3,'#131a19');box(c,x+10,202,46,12,'#171d1d');box(c,x+18,195,27,9,'#20292a');box(c,x+21,197,9,6,'#9b9a80');box(c,x+32,197,9,6,'#788d83');box(c,x+8,207,52,4,'#58635b');box(c,x+14,213,8,7,'#151a1b');box(c,x+47,213,8,7,'#151a1b');box(c,x+52,203,5,3,'#be4a3a');box(c,x+7,203,4,3,'#d9bd80');
  box(c,x+24,193,11,3,'#121819');box(c,x+27,190,6,3,'#141b1b');box(c,x+25,195,10,2,'#bfaa75');
 }
 // lamp posts, telegraph lines and brick walls
 for(let x=140;x<WORLD;x+=282){box(c,x,131,3,89,'#283438');box(c,x-4,130,12,3,'#282e2f');box(c,x-2,126,8,4,'#d7ca9a');box(c,x+1,120,1,8,'#475154');box(c,x+1,113,1,7,'#58605a');}
 // ground wet Belfast street
 box(c,0,218,WORLD,52,'#394543');box(c,0,218,WORLD,4,'#747365');box(c,0,223,WORLD,2,'#a19678');
 for(let x=15;x<WORLD;x+=37){box(c,x,230+(x%11),8+(x%9),1,'#a69c7c');box(c,x+9,247+(x%13),17,1,'#61706a');}
 for(let x=95;x<WORLD;x+=185){box(c,x,234,45,2,'#c2b993');box(c,x+18,236,2,8,'#b9ac86');}
 // steel road drain and road markings
 for(let x=280;x<WORLD;x+=760){box(c,x,220,22,2,'#343d3a');for(let j=0;j<5;j++)box(c,x+j*4,221,1,2,'#788072');}
}

class Title extends Phaser.Scene {
 constructor(){super('Title');}
 create(){
  this.add.image(0,0,'street-art').setOrigin(0).setDisplaySize(W,H).setScrollFactor(.5);
  this.add.rectangle(0,0,W,H,0x0b1316,.50).setOrigin(0).setScrollFactor(0);
  this.add.rectangle(22,20,3,43,0xe5aa4b).setOrigin(0);
  this.add.text(38,18,'A BELFAST ARCADE STORY',{fontFamily:'monospace',fontSize:'9px',color:'#d5c397',letterSpacing:2});
  this.add.text(35,71,'BELFAST',{fontFamily:'Arial Black, sans-serif',fontSize:'46px',fontStyle:'bold',color:'#e7dfc3',stroke:'#251f1a',strokeThickness:5}).setShadow(3,4,'#000000',0.8,true,true);
  this.add.text(39,115,'DEAD CITY',{fontFamily:'Arial Black, sans-serif',fontSize:'35px',fontStyle:'bold',color:'#d45c46',stroke:'#301c19',strokeThickness:5});
  this.add.rectangle(43,160,245,1,0xc0ad7f,.8).setOrigin(0);
  this.add.text(42,171,'BELFAST, NORTHERN IRELAND  /  03:17 AM',{fontFamily:'monospace',fontSize:'9px',color:'#ddd2b7',letterSpacing:1});
  this.add.text(42,190,'THE DEAD HAVE TAKEN THE CITY CENTRE.',{fontFamily:'monospace',fontSize:'9px',color:'#d9d6bd'});
  this.add.text(42,203,'GET TO CITY HALL. MAKE IT COUNT.',{fontFamily:'monospace',fontSize:'9px',color:'#d9d6bd'});
  this.add.text(42,236,'ENTER START   A / D MOVE   SPACE / W JUMP   J FIRE   K GRENADE',{fontFamily:'monospace',fontSize:'8px',color:'#e6b86b',letterSpacing:.4});
  this.add.text(423,251,'PRESS ENTER',{fontFamily:'monospace',fontSize:'8px',color:'#d3d6c6'}).setOrigin(.5).setAlpha(1);
  this.tweens.add({targets:this.children.list.at(-1),alpha:.15,duration:650,yoyo:true,repeat:-1});
  this.input.keyboard!.once('keydown-ENTER',()=>this.scene.start('Game'));
  this.input.keyboard!.once('keydown-SPACE',()=>this.scene.start('Game'));
  this.input.keyboard!.on('keydown-M',()=>AudioBus.toggle());
 }
}

class AudioBus{
 static muted=false; static ctx:AudioContext|null=null;
 static toggle(){this.muted=!this.muted;}
 static play(freq:number=220,duration:number=.06,wave:OscillatorType='square',vol:number=.045){if(this.muted)return; try{this.ctx??=new AudioContext();if(this.ctx.state==='suspended')void this.ctx.resume();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=wave;o.frequency.value=freq;g.gain.setValueAtTime(vol,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration);}catch{}}
}

class Game extends Phaser.Scene {
 player!:AnySprite; bullets!:Phaser.Physics.Arcade.Group; hostiles!:Phaser.Physics.Arcade.Group; hostileShots!:Phaser.Physics.Arcade.Group; grenades!:Phaser.Physics.Arcade.Group; effects!:Phaser.Physics.Arcade.Group; collisionDebug!:Phaser.GameObjects.Graphics; debugEnabled=false;
 keys!:Record<string,Phaser.Input.Keyboard.Key>; health=5; ammo=4; kills=0; elapsed=0; jumpBufferedUntil=0; coyoteUntil=0; lastFire=0; lastGrenade=0; lastDamage=0; actionUntil=0; paused=false; muted=false; wasAirborne=false; dying=false; boss:Phaser.Physics.Arcade.Sprite|null=null; bossHp=0; bossPhase=0; bossAtk=0; locked=new Set<number>(); complete=false; ground!:Phaser.Physics.Arcade.StaticBody; platforms!:Phaser.Physics.Arcade.StaticGroup; spawned:Set<number>=new Set(); hud!:Phaser.GameObjects.Container; section='RESIDENTIAL BELFAST'; sectionText!:Phaser.GameObjects.Text; centerText!:Phaser.GameObjects.Text; overlay!:Phaser.GameObjects.Container; hudText!:Phaser.GameObjects.Text; healthIcons:Phaser.GameObjects.Image[]=[]; grenadeIcons:Phaser.GameObjects.Image[]=[]; bossBar!:Phaser.GameObjects.Rectangle; bossBarBg!:Phaser.GameObjects.Rectangle; prompt!:Phaser.GameObjects.Text; rng=0xBAADF00D;
 constructor(){super('Game');}
 create(){
  this.resetRun();this.physics.world.isPaused=false;
  const activeWorld=V5_BENCHMARK?RESIDENTIAL_END:WORLD;
  this.physics.world.setBounds(0,0,activeWorld,FLOOR+45);
  this.add.image(0,0,'boss-sky').setOrigin(0).setScrollFactor(.12).setDepth(-20);
  this.add.image(0,0,'scenery').setOrigin(0).setDepth(-10);
  const far=new Phaser.GameObjects.TileSprite(this,0,0,WORLD,140,'scenery'); far.setOrigin(0).setPosition(0,72).setTileScale(1.8).setAlpha(.14).setDepth(-9);this.add.existing(far); far.setScrollFactor(.35,0);
  this.add.image(0,0,'game-panorama').setOrigin(0).setDepth(-7);
  this.add.image(0,211,'street-surface').setOrigin(0).setDepth(-3);
  this.add.rectangle(WORLD/2,267,WORLD,6,0x101b1e,.34).setDepth(4);
  this.player=this.physics.add.sprite(80,FLOOR-22,'arc-player-0').setDepth(8).setCollideWorldBounds(true).setGravityY(680).setSize(23,44).setOffset(20,10).setMaxVelocity(205,520);
  this.bullets=this.physics.add.group({defaultKey:'bullet',maxSize:28});this.hostiles=this.physics.add.group({maxSize:24});this.hostileShots=this.physics.add.group({defaultKey:'acid',maxSize:16});this.grenades=this.physics.add.group({defaultKey:'grenade',maxSize:5});this.effects=this.physics.add.group({maxSize:50});
  this.physics.add.overlap(this.bullets,this.hostiles,this.hitEnemy,undefined,this);this.physics.add.overlap(this.player,this.hostiles,this.touchEnemy,undefined,this);this.physics.add.overlap(this.player,this.hostileShots,this.hitPlayer,undefined,this);
  this.cameras.main.setBounds(0,0,activeWorld,H).startFollow(this.player,true,.11,.1).setDeadzone(120,40);
  this.keys=Object.fromEntries(['A','D','W','SPACE','J','K','P','ESC','M','ENTER','R','F2'].map(k=>[k,this.input.keyboard!.addKey(k)])) as Record<string,Phaser.Input.Keyboard.Key>;
  this.debugEnabled=new URLSearchParams(location.search).has('debug');this.collisionDebug=this.add.graphics().setDepth(96).setVisible(this.debugEnabled);
  this.makeHUD();
  const ground=this.physics.add.staticImage(activeWorld/2,FLOOR+24,'bullet').setVisible(false).setDisplaySize(activeWorld,48).refreshBody();this.ground=(ground.body as Phaser.Physics.Arcade.StaticBody);
  this.physics.add.collider(this.player,ground);this.physics.add.collider(this.hostiles,ground);
  this.platforms=this.physics.add.staticGroup();
  this.placePlatform(365,'platform-taxi',120,58);this.placePlatform(805,'platform-wall',100,44);
  this.placePlatform(V5_BENCHMARK?1330:1210,'platform-shelter',90,64);this.placePlatform(1810,'platform-taxi',120,58);
  this.placePlatform(2495,'platform-wall',100,44);this.placePlatform(2910,'platform-taxi',120,58);
  this.physics.add.collider(this.player,this.platforms);this.physics.add.collider(this.hostiles,this.platforms);
  this.physics.add.collider(this.grenades,ground);this.physics.add.collider(this.grenades,this.platforms);

  this.input.keyboard!.on('keydown-M',()=>{AudioBus.toggle();this.updateHud();});
  this.input.keyboard!.on('keydown-F2',()=>{this.debugEnabled=!this.debugEnabled;this.collisionDebug.setVisible(this.debugEnabled);});
  this.input.keyboard!.on('keydown-ESC',()=>this.setPaused(!this.paused));
  this.input.keyboard!.on('keydown-P',()=>this.setPaused(!this.paused));
  this.input.keyboard!.on('keydown-R',()=>this.scene.restart());
  this.input.keyboard!.on('keydown-ENTER',()=>{if(this.complete||this.health<=0)this.scene.restart();});
  this.time.addEvent({delay:980,loop:true,callback:()=>this.ambientFx()});
  this.updateHud();
 }
 resetRun(){this.health=5;this.ammo=4;this.kills=0;this.elapsed=0;this.jumpBufferedUntil=0;this.coyoteUntil=0;this.lastFire=0;this.lastGrenade=0;this.lastDamage=-10000;this.actionUntil=0;this.wasAirborne=false;this.dying=false;this.paused=false;this.boss=null;this.bossHp=0;this.bossPhase=0;this.bossAtk=0;this.locked.clear();this.spawned.clear();this.complete=false;this.section='RESIDENTIAL BELFAST';this.rng=0xBAADF00D;this.healthIcons=[];this.grenadeIcons=[];}
 placePlatform(x:number,key:string,w:number,h:number){
  const cy=FLOOR-h/2;this.add.image(x,cy,key).setDepth(6);
  const taxiDeck=V5_TAXI_ART_ANCHORS.deck;
  const anchor=key==='platform-taxi'
   ?{centerOffsetX:(taxiDeck.left+taxiDeck.right)/2-V5_TAXI_ART_ANCHORS.width/2,
     topOffsetY:taxiDeck.y-V5_TAXI_ART_ANCHORS.height/2,width:taxiDeck.right-taxiDeck.left}
   :PLATFORM_ROOFS[key as keyof typeof PLATFORM_ROOFS]??{centerOffsetX:0,topOffsetY:-h/2,width:w-14};
  const roof=cy+anchor.topOffsetY;
  const body=this.physics.add.staticImage(x+anchor.centerOffsetX,roof+2,'bullet').setVisible(false).setDisplaySize(anchor.width,4).refreshBody();
  const collision=body.body as Phaser.Physics.Arcade.StaticBody;collision.checkCollision.down=false;collision.checkCollision.left=false;collision.checkCollision.right=false;
  body.setData('platform',key);body.setData('artworkWidth',w);body.setData('artworkTop',roof);body.setData('roofAnchor',{...anchor,worldX:x+anchor.centerOffsetX,worldY:roof});
  this.platforms.add(body);
 }
 makeHUD(){
  const hud=this.add.container(0,0).setScrollFactor(0).setDepth(100);this.hud=hud;
  hud.add(this.add.rectangle(0,0,W,36,0x101719,.94).setOrigin(0));hud.add(this.add.rectangle(0,36,W,1,0x897b61,.75).setOrigin(0));
  hud.add(this.add.text(11,6,'B:DC',{fontFamily:'monospace',fontSize:'10px',color:'#e0a94e',fontStyle:'bold'}));hud.add(this.add.text(11,19,'CITY // 03:17',{fontFamily:'monospace',fontSize:'7px',color:'#83918a'}));
  for(let i=0;i<5;i++){const im=this.add.image(108+i*13,15,'heart').setOrigin(0).setScale(1.15);this.healthIcons.push(im);hud.add(im);}
  hud.add(this.add.text(169,9,'GRENADE',{fontFamily:'monospace',fontSize:'7px',color:'#929b89'}));for(let i=0;i<4;i++){const im=this.add.image(173+i*11,22,'grenade').setOrigin(0).setScale(.9);this.grenadeIcons.push(im);hud.add(im);}
  this.sectionText=this.add.text(334,9,this.section,{fontFamily:'monospace',fontSize:'7px',color:'#bec6b2',align:'center'}).setOrigin(.5,0);hud.add(this.sectionText);
  this.hudText=this.add.text(468,21,'',{fontFamily:'monospace',fontSize:'7px',color:'#e0dfc6',align:'right'}).setOrigin(1,0);hud.add(this.hudText);
  hud.add(this.add.text(464,7,'M  AUDIO',{fontFamily:'monospace',fontSize:'6px',color:'#87938c'}).setOrigin(1,0));
  this.bossBarBg=this.add.rectangle(240,50,210,5,0x1b2120).setScrollFactor(0).setDepth(100).setVisible(false);this.bossBar=this.add.rectangle(135,50,210,3,0xd0523e).setOrigin(0,.5).setScrollFactor(0).setDepth(101).setVisible(false);hud.add(this.bossBarBg);hud.add(this.bossBar);
  this.centerText=this.add.text(W/2,66,'',{fontFamily:'monospace',fontSize:'8px',color:'#e2c794',letterSpacing:1,align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(100).setAlpha(0);hud.add(this.centerText);
  this.overlay=this.add.container(W/2,H/2).setScrollFactor(0).setDepth(110).setVisible(false);hud.add(this.overlay);
  this.prompt=this.add.text(W/2,H-13,'',{fontFamily:'monospace',fontSize:'7px',color:'#9ba49a'}).setOrigin(.5).setScrollFactor(0).setDepth(100);hud.add(this.prompt);
 }
 updateHud(){
  this.healthIcons.forEach((i,n)=>i.setAlpha(n<this.health?1:.2));this.grenadeIcons.forEach((i,n)=>i.setAlpha(n<this.ammo?1:.2));
  this.sectionText.setText(this.section);
  this.hudText.setText(`${String(Math.floor(this.elapsed/60)).padStart(2,'0')}:${String(Math.floor(this.elapsed%60)).padStart(2,'0')}   ${String(this.kills).padStart(2,'0')}X`);
  this.prompt.setText(`A / D MOVE   SPACE JUMP   J FIRE   K GRENADE   P / ESC PAUSE   R RESTART   M MUTE`);
  if(this.paused){if(!this.overlay.visible||this.overlay.getData('state')!=='PAUSED')this.showOverlay('PAUSED','P / ESC RESUME     R RESTART');}
  else if(this.complete){if(!this.overlay.visible||this.overlay.getData('state')!=='WIN')this.showOverlay('BELFAST STANDS','VICTORY  //  ENTER OR R TO PLAY AGAIN');}
  else if(this.health<=0&&!this.dying){if(!this.overlay.visible||this.overlay.getData('state')!=='DOWN')this.showOverlay('YOU FELL IN BELFAST','ENTER OR R  /  TRY AGAIN');}
  else{this.overlay.setVisible(false);this.overlay.setData('state','');}
 }
 setPaused(value:boolean){this.paused=value;this.physics.world.isPaused=value;this.time.timeScale=value?0:1;this.tweens.timeScale=value?0:1;this.updateHud();}
 showOverlay(title:string,sub:string){this.overlay.removeAll(true);this.overlay.setVisible(true).setData('state',title==='PAUSED'?'PAUSED':title==='BELFAST STANDS'?'WIN':'DOWN');this.overlay.add(this.add.rectangle(0,0,288,94,0x11191a,.95).setStrokeStyle(1,0xa98c57).setInteractive({useHandCursor:true}).on('pointerup',()=>this.scene.restart()));this.overlay.add(this.add.text(0,-19,title,{fontFamily:'Arial Black, sans-serif',fontSize:'19px',fontStyle:'bold',color:'#e0ad5e',stroke:'#322820',strokeThickness:2}).setOrigin(.5));this.overlay.add(this.add.text(0,17,sub,{fontFamily:'monospace',fontSize:'7px',color:'#e1dfcc',letterSpacing:1}).setOrigin(.5));}
 sectionAt(x:number){return V5_BENCHMARK||x<=RESIDENTIAL_END?'RESIDENTIAL BELFAST':x<3050?'CITY CENTRE':'CITY HALL';}
 rand(){this.rng=(this.rng*1664525+1013904223)>>>0;return this.rng/4294967296;}
 update(_t:number,dt:number){
  if(this.health<=0||this.complete)return;if(this.paused)return;
  const d=Math.min(dt,40);this.elapsed+=d/1000;const x=this.player.x;this.section=this.sectionAt(x);
  const body=this.player.body as Phaser.Physics.Arcade.Body,now=this.elapsed*1000;
  if(body.blocked.down||body.touching.down)this.coyoteUntil=now+115;
  if(this.keys.A.isDown||this.keys.D.isDown){const dir=this.keys.A.isDown?-1:1;this.player.setVelocityX(dir*(this.keys.A.isDown&&this.keys.D.isDown?0:145));this.player.setFlipX(dir<0);}else this.player.setVelocityX(body.velocity.x*.78);
  if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE)||Phaser.Input.Keyboard.JustDown(this.keys.W))this.jumpBufferedUntil=now+145;
  if(now<this.jumpBufferedUntil&&now<this.coyoteUntil){this.jumpBufferedUntil=0;this.coyoteUntil=0;this.player.setVelocityY(this.keys.SPACE.isDown||this.keys.W.isDown?-340:-305);this.wasAirborne=true;this.fx(this.player.x,this.player.y+17,'landing');AudioBus.play(330,.07,'triangle',.03);}
  if(body.velocity.y>45)this.wasAirborne=true;
  if(this.wasAirborne&&(body.blocked.down||body.touching.down)&&body.velocity.y===0){this.wasAirborne=false;this.fx(this.player.x,this.player.y+17,'landing');AudioBus.play(115,.04,'triangle',.018);}
  if(this.keys.J.isDown||Phaser.Input.Keyboard.JustDown(this.keys.J))this.fire();if(Phaser.Input.Keyboard.JustDown(this.keys.K))this.throwGrenade();
  this.animatePlayer();this.waveCheck(x);this.updateEnemies(d);this.updateObjects();this.updateBoss(d);this.updateHud();if(this.debugEnabled)this.drawCollisionDebug();
 }
 drawCollisionDebug(){
  const g=this.collisionDebug;g.clear();
  const outline=(obj:AnySprite,color:number)=>{const body=obj?.body as Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|undefined;if(!obj?.active||!body?.enable)return;g.lineStyle(1,color,.96);g.strokeRect(Math.round(body.x),Math.round(body.y),Math.round(body.width),Math.round(body.height));};
  outline(this.player,0x49f1db);
  for(const item of this.platforms.getChildren() as AnySprite[])outline(item,0xf0ce67);
  for(const item of this.hostiles.getChildren() as AnySprite[])outline(item,0xff766a);
  for(const item of this.bullets.getChildren() as AnySprite[])outline(item,0xffd16e);
  for(const item of this.hostileShots.getChildren() as AnySprite[])outline(item,0xff9f45);
  for(const item of this.grenades.getChildren() as AnySprite[])outline(item,0xffd16e);
  if(this.boss)outline(this.boss,0xf36a61);
  g.lineStyle(1,0x68b4ef,.75);g.strokeRect(0,FLOOR,WORLD,1);
 }
 animatePlayer(){const v=Math.abs(this.player.body!.velocity.x),f=Math.floor(this.elapsed*12)%4;let ix=0;const now=this.elapsed*1000;if(now<this.lastDamage+220)ix=5;else if(this.player.body!.velocity.y<-30)ix=3;else if(this.player.body!.velocity.y>55)ix=7;else if(now<this.actionUntil)ix=6;else if(now<this.lastFire+95)ix=4;else if(v>16)ix=f%2?1:2;this.player.setTexture(`arc-player-${ix}`);}
 fire(){if(this.elapsed*1000-this.lastFire<130)return;this.lastFire=this.elapsed*1000;const dir=this.player.flipX?-1:1,b=this.bullets.get(this.player.x+dir*23,this.player.y-5,'bullet') as AnySprite|null;if(!b)return;b.setActive(true).setVisible(true).setDepth(12).setFlipX(dir<0);b.body?.reset(b.x,b.y);b.setVelocityX(dir*455);b.setVelocityY(0);(b.body as Phaser.Physics.Arcade.Body).allowGravity=false;b.setData('life',0);this.actionUntil=Math.max(this.actionUntil,this.elapsed*1000+80);this.fx(this.player.x+dir*20,this.player.y-8,'flash');AudioBus.play(500,.035,'square',.035);}
 throwGrenade(){if(!this.ammo||this.elapsed*1000-this.lastGrenade<500)return;this.lastGrenade=this.elapsed*1000;this.actionUntil=this.elapsed*1000+220;this.ammo--;const dir=this.player.flipX?-1:1,g=this.grenades.get(this.player.x+dir*20,this.player.y-5,'grenade') as AnySprite|null;if(g){g.setActive(true).setVisible(true).setDepth(12);g.body?.reset(g.x,g.y);const body=g.body as Phaser.Physics.Arcade.Body;body.enable=true;body.allowGravity=true;body.setGravityY(680);g.setVelocity(dir*155,-280);g.setBounce(.48);g.setData('life',0);}AudioBus.play(140,.1,'triangle',.06);this.updateHud();}
 waveCheck(x:number){
  if(V5_BENCHMARK)return;
  const waves=[
   {at:390,types:['shambler','shambler','shambler']},{at:700,types:['runner','shambler','shambler']},
   {at:1000,types:['shambler','shambler','shambler','shambler']},{at:1260,types:['runner','shambler','shambler','runner']},
   {at:1620,types:['runner','runner','shambler','shambler']},{at:1930,types:['spitter','runner','shambler']},
   {at:2220,types:['runner','runner','spitter','shambler']},{at:2530,types:['spitter','runner','runner','shambler']},
   {at:2820,types:['spitter','runner','runner']},{at:3100,types:['runner','runner','spitter','shambler']},
   {at:3390,types:['runner','runner','spitter','shambler']},{at:3680,types:['spitter','runner','shambler','shambler']},
   {at:3910,types:['runner','runner','spitter']}
  ];
  for(let i=0;i<waves.length;i++){const w=waves[i]!;if(x>w.at&&!this.spawned.has(i)){this.spawned.add(i);w.types.forEach((type,j)=>this.spawnEnemy(w.at+j*39,type));}}
  if(!V5_BENCHMARK&&x>1410&&!this.locked.has(0)){this.locked.add(0);this.banner('SECTION II  /  CITY CENTRE');}
  if(x>3005&&!this.locked.has(1)){this.locked.add(1);const before=this.health;this.health=Math.min(5,this.health+3);this.banner(this.health>before?'SECTION III  /  CITY HALL  //  +3 HEALTH':'SECTION III  /  CITY HALL');if(this.health>before){this.fx(this.player.x,this.player.y-10,'pickup');AudioBus.play(560,.1,'triangle',.035);}}
  if(x>3995&&!this.locked.has(2)){this.locked.add(2);this.startBoss();}
 }
 spawnEnemy(x:number,type:string){const side=this.rand()<.32?-1:1;const spawnX=x+(side<0?-200:220),key=type==='runner'?'arc-zombie-4':type==='shambler'?'arc-zombie-0':'spitter-0';const e=this.hostiles.get(spawnX,FLOOR-22,key) as AnySprite|null;if(!e)return;e.setActive(true).setVisible(true).setDepth(9).setCollideWorldBounds(true).setGravityY(680).setVelocityX(0);if(type==='spitter')e.setScale(1.25).setSize(17,29).setOffset(3,3);else e.setScale(1).setSize(24,44).setOffset(20,10);const body=e.body as Phaser.Physics.Arcade.Body;body.enable=true;body.allowGravity=true;body.reset(spawnX,FLOOR-22);body.setMaxVelocity(220,520);e.setData({kind:type,hp:type==='shambler'?4:type==='runner'?2:3,attack:0,frame:0,hit:0,hitUntil:0,climbAt:0,state:'stalk',dead:false});}
 updateEnemies(_d:number){const now=this.elapsed*1000;for(const e of this.hostiles.getChildren() as AnySprite[]){if(!e.active)continue;if(e.x<this.player.x-460){e.disableBody(true,true);continue;}const k=e.getData('kind') as string,dx=this.player.x-e.x,dir=Math.sign(dx)||1,dist=Math.abs(dx),body=e.body as Phaser.Physics.Arcade.Body,state=e.getData('state') as string||'stalk';
  if(now<(e.getData('hitUntil') as number)){body.setVelocityX(body.velocity.x*.84);e.setTexture(k==='runner'?'arc-zombie-7':k==='spitter'?'spitter-3':'arc-zombie-3').setTintFill(0xffecd0);continue;}else e.clearTint();
  const playerAbove=this.player.y<e.y-29;if(playerAbove&&dist<112&&now>(e.getData('climbAt') as number||0)&&(body.blocked.down||body.touching.down)){body.setVelocityY(-330);e.setData('climbAt',now+1250);}
  if(k==='spitter'){
   if(state==='windup'){body.setVelocityX(0);if(now>=(e.getData('attackAt') as number)){e.setData('state','stalk');e.setData('attack',now+1850);this.acid(e,dir);}}
   else if(dist<285&&dist>100){body.setVelocityX(0);if(now>(e.getData('attack') as number)){e.setData('state','windup');e.setData('attackAt',now+620);}}
   else body.setVelocityX(dir*26);
   const f=state==='windup'?3:Math.floor(now/300)%2;e.setTexture(`spitter-${f}`);
  }else if(k==='runner'){
   if(state==='windup'){body.setVelocityX(0);if(now>=(e.getData('attackAt') as number)){e.setData('state','lunge');e.setData('attackAt',now+420);body.setVelocityX(dir*225);body.setVelocityY(playerAbove?-305:-70);}}
   else if(state==='lunge'){body.setVelocityX(dir*175);if(now>=(e.getData('attackAt') as number)){e.setData('state','stalk');e.setData('attack',now+1050);}}
   else{body.setVelocityX(dir*(dist<48?0:77));if(dist<112&&now>(e.getData('attack') as number)){e.setData('state','windup');e.setData('attackAt',now+470);}}
   e.setTexture(state==='windup'?'arc-zombie-4':state==='lunge'?'arc-zombie-7':`arc-zombie-${Math.floor(now/110)%2?5:6}`);
  }else{
   if(state==='windup'){body.setVelocityX(0);if(now>=(e.getData('attackAt') as number)){e.setData('state','stalk');e.setData('attack',now+1100);if(dist<68&&Math.abs(e.y-this.player.y)<48)this.damage(1,e.x);}}
   else{body.setVelocityX(dir*(dist<48?0:36));if(dist<68&&Math.abs(e.y-this.player.y)<48&&now>(e.getData('attack') as number)){e.setData('state','windup');e.setData('attackAt',now+520);}}
   e.setTexture(state==='windup'?'arc-zombie-2':Math.floor(now/245)%2?'arc-zombie-0':'arc-zombie-1');
  }
  e.setFlipX(dir<0);
 }}
 acid(e:AnySprite,dir:number){const p=this.hostileShots.get(e.x+dir*20,e.y-9,'acid') as AnySprite|null;if(!p)return;p.setActive(true).setVisible(true).setDepth(11);p.body?.reset(p.x,p.y);const aim=Math.atan2(this.player.y-e.y,this.player.x-e.x);p.setVelocity(Math.cos(aim)*155,Math.sin(aim)*155);p.setRotation(aim);p.setData('life',0);AudioBus.play(185,.09,'sawtooth',.025);}
 hitEnemy(b:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,e:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){const bullet=b as AnySprite,enemy=e as AnySprite;if(!bullet.active||!enemy.active)return;const shove=Math.sign((bullet.body as Phaser.Physics.Arcade.Body).velocity.x)||1;bullet.destroy();const hp=(enemy.getData('hp') as number)-1,now=this.elapsed*1000;enemy.setData('hp',hp);enemy.setData('hit',now);enemy.setData('hitUntil',now+115);enemy.setVelocityX(shove*105);this.fx(enemy.x,enemy.y-8,'hit');AudioBus.play(245,.025,'square',.02);if(hp<=0)this.killEnemy(enemy);}
 killEnemy(e:AnySprite){if(e.getData('dead'))return;const x=e.x,y=e.y,key=e.texture.key,flip=e.flipX;e.setData('dead',true);e.disableBody(true,true);const corpse=this.add.image(x,y,key).setDepth(10).setFlipX(flip).setTint(0xb49b85);this.tweens.add({targets:corpse,y:y+6,alpha:0,scaleX:.78,scaleY:.48,angle:flip?-12:12,duration:310,ease:'Quad.easeIn',onComplete:()=>corpse.destroy()});this.kills++;this.fx(x,y-5,'death');AudioBus.play(100,.16,'triangle',.04);if(this.rand()<.18&&this.ammo<4){this.ammo++;this.fx(x,y-14,'pickup');}}
 touchEnemy(_p:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,e:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){this.damage(1,(e as AnySprite).x);}
 hitPlayer(a:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,b:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){const objects=[a,b] as AnySprite[];const projectile=objects.find(o=>o&&o!==this.player&&o.texture?.key==='acid')??objects.find(o=>o&&o!==this.player&&typeof o.destroy==='function');projectile?.destroy?.();this.damage(1,this.player.x);}
 damage(n:number,x:number){
  const now=this.elapsed*1000,body=this.player?.body as Phaser.Physics.Arcade.Body|null;
  if(now-this.lastDamage<1050||this.health<=0||!body)return;
  this.lastDamage=now;this.health=Math.max(0,this.health-n);this.player.setTintFill(0xffffff);this.time.delayedCall(110,()=>this.player?.clearTint());
  const dir=Math.sign(this.player.x-x||1);body.setVelocityX(dir*(this.health===0?110:185));body.setVelocityY(this.health===0?-230:-125);this.wasAirborne=true;
  this.cameras.main.shake(this.health===0?330:190,this.health===0 ? .014 : .009);AudioBus.play(this.health===0?55:75,.18,'sawtooth',.055);this.fx(x,this.player.y,'hit');
  if(this.health===0){
   this.dying=true;this.player.setTexture('arc-player-5').setAngle(dir*8);
   this.time.delayedCall(170,()=>{if(this.player?.active)this.player.setTexture('arc-player-7');});
   this.tweens.add({targets:this.player,angle:dir*72,duration:610,ease:'Quad.easeIn',onComplete:()=>{this.player.disableBody(false,false);this.dying=false;this.updateHud();}});
  }
  this.updateHud();
 }
 hitBoss(a:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,b:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){const objects=[a,b] as AnySprite[];const bullet=objects.find(o=>o!==this.boss&&o?.texture?.key==='bullet')??objects.find(o=>o!==this.boss&&o?.active&&typeof o.destroy==='function');if(!bullet?.active||!this.boss?.active)return;bullet.destroy();this.bossHp--;this.boss?.setTintFill(0xffffff);this.time.delayedCall(90,()=>this.boss?.clearTint());this.fx(this.boss!.x+(this.rand()-.5)*50,this.boss!.y-13,'hit');this.cameras.main.shake(72,.0025);this.updateBossHud();if(this.bossHp<=0)this.nextBossPhase();}
 nextBossPhase(){if(this.bossPhase===0){this.bossPhase=1;this.bossHp=26;this.bossAtk=this.elapsed*1000+1250;this.banner('IT IS RISING AGAIN  //  PHASE II');this.cameras.main.flash(260,110,177,112);this.boss?.setTexture('arc-boss-3').clearTint();this.updateBossHud();}else this.win();}
 startBoss(){const before=this.health;this.health=Math.min(5,this.health+3);this.banner(this.health>before?'CITY HALL FIELD KIT  //  +3 HEALTH':'THE CITY HALL // SOMETHING STIRS');if(this.health>before){this.fx(this.player.x,this.player.y-10,'pickup');AudioBus.play(600,.12,'triangle',.045);}this.boss=this.physics.add.sprite(4320,FLOOR-64,'arc-boss-0').setDepth(10).setCollideWorldBounds(true).setGravityY(680).setSize(76,92).setOffset(26,37);this.boss.setScale(1);this.bossHp=38;this.bossPhase=0;this.boss.setData({windupUntil:0,slamUntil:0});this.physics.add.overlap(this.bullets,this.boss,this.hitBoss,undefined,this);this.physics.add.collider(this.boss,this.ground.gameObject);this.physics.add.collider(this.boss,this.platforms);this.bossAtk=this.elapsed*1000;this.bossBarBg.setVisible(true);this.bossBar.setVisible(true);this.updateBossHud();this.updateHud();this.cameras.main.shake(500,.009);AudioBus.play(48,.5,'sawtooth',.06);}
 updateBossHud(){if(!this.boss)return;const max=this.bossPhase===0?38:26;this.bossBar.width=Math.max(0,210*this.bossHp/max);this.bossBar.setFillStyle(this.bossPhase===1?0xb7b35e:0xd0523e);}
 updateBoss(_d:number){
  const b=this.boss;if(!b?.active)return;
  const dir=Math.sign(this.player.x-b.x)||1,dist=Math.abs(this.player.x-b.x),phase=this.bossPhase,now=this.elapsed*1000,interval=phase===0?2600:2850;
  if(dist>82)b.setVelocityX(dir*(phase===0?27:48));else b.setVelocityX(0);
  if(now-this.bossAtk>interval){
   this.bossAtk=now;
   if(phase===0){
    const targetX=Phaser.Math.Clamp(this.player.x,4080,4580);
    b.setData('windupUntil',now+850);b.setTexture('arc-boss-1');
    this.banner('GROUND SLAM  //  CLEAR THE WARNING MARKERS');
    const marks:Phaser.GameObjects.Rectangle[]=[];
    for(let j=-1;j<=1;j++){const mark=this.add.rectangle(targetX+j*34,FLOOR-12,12,25,0xf1b251,.72).setDepth(7);marks.push(mark);this.tweens.add({targets:mark,alpha:{from:.18,to:.85},duration:160,yoyo:true,repeat:3});}
    this.time.delayedCall(850,()=>{if(!this.boss?.active||this.bossPhase!==0)return;this.boss!.setData('slamUntil',this.elapsed*1000+320).setTexture('arc-boss-2');marks.forEach(m=>m.destroy());for(let j=-1;j<=1;j++)this.fx(targetX+j*34,FLOOR-4,'impact');this.cameras.main.shake(220,.009);if(Math.abs(this.player.x-targetX)<45&&this.player.y>FLOOR-42)this.damage(1,targetX);this.time.delayedCall(330,()=>{if(this.boss?.active&&this.bossPhase===0)this.boss.setTexture('arc-boss-0');});});
   }else{
    this.banner('ACID VOLLEY  //  JUMP OR BREAK AWAY');
    const bx=b.x,by=b.y-24,aim=Math.atan2(this.player.y-by,this.player.x-bx);
    this.time.delayedCall(450,()=>{if(!this.boss?.active||this.bossPhase!==1)return;for(const offset of [-.25,0,.25]){const p=this.hostileShots.get(bx+dir*38,by,'acid') as AnySprite|null;if(p){p.setActive(true).setVisible(true);p.body?.reset(p.x,p.y);const a=aim+offset;p.setVelocity(Math.cos(a)*180,Math.sin(a)*180);p.setRotation(a);p.setData('life',0);}}});
   }
  }
  b.setFlipX(dir<0);
  if(phase===1)b.setTexture('arc-boss-3');
  else if(now<(b.getData('windupUntil') as number)||now<(b.getData('slamUntil') as number))b.setTexture(now<(b.getData('slamUntil') as number)?'arc-boss-2':'arc-boss-1');
  else if(b.texture.key!=='arc-boss-0')b.setTexture('arc-boss-0');
 }
 win(){if(this.complete)return;this.complete=true;const b=this.boss;if(b?.active){const corpse=this.add.image(b.x,b.y,b.texture.key).setDepth(12).setScale(b.scaleX).setFlipX(b.flipX).setTint(0xd9c6a0);b.disableBody(true,true);this.tweens.add({targets:corpse,angle:-25,y:corpse.y+24,scaleX:corpse.scaleX*1.18,alpha:0,duration:1050,ease:'Quad.easeIn',onComplete:()=>corpse.destroy()});}this.bossBarBg.setVisible(false);this.bossBar.setVisible(false);this.cameras.main.flash(650,245,219,155);this.cameras.main.shake(400,.012);this.banner('BELFAST STANDS');for(let i=0;i<7;i++)this.time.delayedCall(i*115,()=>this.fx(this.boss?.x??4320,FLOOR-15,'impact'));AudioBus.play(660,.4,'triangle',.08);this.time.delayedCall(450,()=>this.updateHud());this.updateHud();}
 banner(t:string){this.centerText.setText(t).setAlpha(1).setScale(1.12);this.tweens.add({targets:this.centerText,alpha:0,scale:1,duration:1600,ease:'Cubic.easeOut'});}
 fx(x:number,y:number,kind:string){
  if(kind==='flash'){const im=this.add.image(x,y,'fire-0').setDepth(14).setBlendMode(Phaser.BlendModes.ADD);this.tweens.add({targets:im,alpha:0,scaleX:1.7,scaleY:1.45,duration:100,onComplete:()=>im.destroy()});return;}
  const count=kind==='impact'?11:kind==='death'?8:kind==='pickup'?4:kind==='landing'?3:4;for(let i=0;i<count;i++){const p=this.effects.get(x,y,`smoke-${i%4}`) as AnySprite|null;if(!p)continue;p.setTexture(kind==='impact'?`fire-${i%7}`:`smoke-${i%4}`).setActive(true).setVisible(true).setDepth(14).setScale(kind==='impact'?1.2:.75+this.rand()*.7);p.body?.reset(x,y);(p.body as Phaser.Physics.Arcade.Body).allowGravity=true;p.setVelocity((this.rand()-.5)*(kind==='impact'?230:kind==='landing'?70:115),kind==='landing'?-this.rand()*45:-this.rand()*(kind==='impact'?210:110));p.setData('life',0);}
 }
 updateObjects(){
  for(const group of [this.bullets,this.grenades,this.hostileShots,this.effects])for(const s of group.getChildren() as AnySprite[]){if(!s.active)continue;const life=(s.getData('life') as number||0)+1;s.setData('life',life);
   if(s===this.bullets.getChildren().find(q=>q===s)){if(life>55||s.x<0||s.x>WORLD)s.destroy();}
   else if(s===this.grenades.getChildren().find(q=>q===s)){if(life>75){this.explode(s.x,s.y);s.destroy();}}
   else if(group===this.hostileShots){if(life>110||s.x<0||s.x>WORLD)s.destroy();}
   else if(life>22)s.destroy();
  }
 }
 explode(x:number,y:number){this.cameras.main.shake(230,.009);this.cameras.main.flash(85,255,202,117);const blast=this.add.sprite(x,y,'arc-blast-0').setDepth(18).setBlendMode(Phaser.BlendModes.ADD).setScale(1.45);blast.play('arc-blast');blast.once(Phaser.Animations.Events.ANIMATION_COMPLETE,()=>blast.destroy());this.fx(x,y,'impact');AudioBus.play(95,.16,'sawtooth',.07);for(const e of this.hostiles.getChildren() as AnySprite[]){if(!e.active)continue;const dist=Phaser.Math.Distance.Between(x,y,e.x,e.y);if(dist<112)this.killEnemy(e);else if(dist<170){e.setVelocityX(Math.sign(e.x-x||1)*110);e.setData('hitUntil',this.elapsed*1000+180);}}if(this.boss?.active&&Phaser.Math.Distance.Between(x,y,this.boss.x,this.boss.y)<128){this.bossHp-=7;this.boss.setTint(0xf0c67c);this.time.delayedCall(130,()=>this.boss?.clearTint());this.updateBossHud();if(this.bossHp<=0)this.nextBossPhase();}}
 ambientFx(){if(this.health<=0||this.complete)return;const cx=this.cameras.main.scrollX,x=cx+12+this.rand()*(W-24);const drop=this.add.rectangle(x,178+this.rand()*32,1,6+this.rand()*8,0xbec6b0,.2).setDepth(13).setAngle(-.16);this.tweens.add({targets:drop,x:x+4,y:drop.y+23,alpha:0,duration:470,onComplete:()=>drop.destroy()});if(this.rand()<.34){const ripple=this.add.rectangle(x,FLOOR-2,3,1,0xa6b8a6,.28).setDepth(3);this.tweens.add({targets:ripple,scaleX:3,alpha:0,duration:290,onComplete:()=>ripple.destroy()});}}
}

const game=new Phaser.Game({type:Phaser.CANVAS,width:W,height:H,parent:'game',backgroundColor:'#101719',pixelArt:true,antialias:false,roundPixels:true,physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},scene:[Boot,Title,Game,BenchmarkScene,ResidentialScene],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{pixelArt:true,antialias:false,roundPixels:true}});
if (new URLSearchParams(location.search).has('test')) {
  Object.defineProperty(window, '__belfast', { value: { scene: (key: string) => game.scene.getScene(key), fps: () => game.loop.actualFps }, configurable: true });
}
window.addEventListener('pagehide',()=>game.destroy(true));
