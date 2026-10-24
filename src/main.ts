import Phaser from 'phaser';
import './style.css';

const W=480,H=270, WORLD=4980, FLOOR=225;

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
 create(){
  const s=this;
  for(const kind of ['player','shambler','runner','spitter']) for(let f=0;f<4;f++) canvasTex(s,`${kind}-${f}`,24,32,c=>spriteDraw(c,kind,f));
  canvasTex(s,'bullet',7,3,c=>{box(c,0,1,7,1,'#fff1ad');box(c,2,0,3,3,'#ed9d44');});
  canvasTex(s,'acid',7,5,c=>{box(c,1,1,5,3,'#9bd18c');box(c,2,0,3,5,'#c1d877');});
  canvasTex(s,'grenade',8,8,c=>{box(c,2,1,5,6,'#7b8065');box(c,1,2,6,4,'#9ca17a');box(c,3,0,3,2,'#dbbb70');});
  canvasTex(s,'heart',9,8,c=>{box(c,1,1,3,2,'#c84b3a');box(c,5,1,3,2,'#c84b3a');box(c,1,2,7,3,'#e46043');box(c,2,5,5,2,'#ba392e');box(c,3,7,3,1,'#852c28');});
  for(let f=0;f<7;f++) canvasTex(s,`fire-${f}`,24,24,c=>{box(c,9-f%3,11-f,6+f%2,6+f,'#d95134');box(c,11,9-f,3,8+f,'#f0c35d');box(c,12,12-f,2,4,'#fff0af');});
  for(let f=0;f<4;f++) canvasTex(s,`smoke-${f}`,16,16,c=>{for(let i=0;i<8;i++){const x=2+(i*7+f*3)%11,y=2+(i*5+f*4)%11;box(c,x,y,2,2,['#61706a','#899086','#475a5b'][i%3]);}});
  for(let f=0;f<3;f++)canvasTex(s,`zombie-large-${f}`,72,88,c=>drawBoss(c,f));
  canvasTex(s,'scenery',WORLD,270,c=>drawScenery(c));
  canvasTex(s,'hall',400,190,c=>drawCityHall(c));
  canvasTex(s,'boss-sky',WORLD,270,c=>drawSky(c));
  this.scene.start('Title');
 }
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
function drawBoss(c:CanvasRenderingContext2D,frame:number){
 const swing=[0,3,-2][frame]!;
 box(c,16,81,42,4,'#111719');box(c,15,65,17,18,'#454d40');box(c,39,66,17,17,'#414a3d');box(c,12,44,49,30,'#59654b');box(c,8,34,56,20,'#647151');box(c,15,16,43,27,'#72775e');box(c,19,11,37,12,'#686f59');
 box(c,20,25,11,10,'#a0a080');box(c,43,25,10,10,'#a0a080');box(c,23,27,7,7,'#e1b856');box(c,44,27,7,7,'#e1b856');box(c,23,28+(frame===2?1:0),4,5,'#b34435');box(c,46,28+(frame===2?1:0),4,5,'#b34435');
 box(c,28,39+(frame===1?1:0),21,6,'#423b34');box(c,32,40+(frame===1?1:0),4,4,'#dfd4b3');box(c,41,40+(frame===1?1:0),4,4,'#ded0a9');
 box(c,6,47,13,22,'#586548');box(c,1,60+swing,14,12,'#765644');box(c,55,47,14,21,'#516045');box(c,62,59-swing,9,15,'#785740');box(c,35,50,8,15,'#9f4835');box(c,41,58,6,10,'#c16646');
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
  this.add.image(0,0,'scenery').setOrigin(0).setDisplaySize(W,W).setScrollFactor(.5);
  this.add.rectangle(0,0,W,H,0x0b1316,.50).setOrigin(0).setScrollFactor(0);
  this.add.rectangle(22,20,3,43,0xe5aa4b).setOrigin(0);
  this.add.text(38,18,'A BELFAST ARCADE STORY',{fontFamily:'monospace',fontSize:'9px',color:'#d5c397',letterSpacing:2});
  this.add.text(35,71,'BELFAST',{fontFamily:'Arial Black, sans-serif',fontSize:'46px',fontStyle:'bold',color:'#e7dfc3',stroke:'#251f1a',strokeThickness:5}).setShadow(3,4,'#000000',0.8,true,true);
  this.add.text(39,115,'DEAD CITY',{fontFamily:'Arial Black, sans-serif',fontSize:'35px',fontStyle:'bold',color:'#d45c46',stroke:'#301c19',strokeThickness:5});
  this.add.rectangle(43,160,245,1,0xc0ad7f,.8).setOrigin(0);
  this.add.text(42,171,'BELFAST, NORTHERN IRELAND  /  03:17 AM',{fontFamily:'monospace',fontSize:'9px',color:'#ddd2b7',letterSpacing:1});
  this.add.text(42,190,'THE DEAD HAVE TAKEN THE CITY CENTRE.',{fontFamily:'monospace',fontSize:'9px',color:'#d9d6bd'});
  this.add.text(42,203,'GET TO CITY HALL. MAKE IT COUNT.',{fontFamily:'monospace',fontSize:'9px',color:'#d9d6bd'});
  this.add.text(42,236,'ENTER  START      A / D  MOVE      SPACE  JUMP      J  FIRE      K  GRENADE',{fontFamily:'monospace',fontSize:'8px',color:'#e6b86b',letterSpacing:.6});
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
 player!:AnySprite; bullets!:Phaser.Physics.Arcade.Group; hostiles!:Phaser.Physics.Arcade.Group; hostileShots!:Phaser.Physics.Arcade.Group; grenades!:Phaser.Physics.Arcade.Group; effects!:Phaser.Physics.Arcade.Group;
 keys!:Record<string,Phaser.Input.Keyboard.Key>; health=5; ammo=4; kills=0; elapsed=0; jumpBufferedUntil=0; lastGroundedAt=-Infinity; lastFire=0; lastGrenade=0; lastDamage=-Infinity; paused=false; muted=false; boss:Phaser.Physics.Arcade.Sprite|null=null; bossHp=0; bossPhase=0; bossAtk=0; locked=new Set<number>(); touchingEnemies=new Set<AnySprite>(); complete=false; ground!:Phaser.Physics.Arcade.StaticBody; platforms!:Phaser.Physics.Arcade.StaticGroup; spawned:Set<number>=new Set(); hud!:Phaser.GameObjects.Container; section='RESIDENTIAL BELFAST'; sectionText!:Phaser.GameObjects.Text; centerText!:Phaser.GameObjects.Text; overlay!:Phaser.GameObjects.Container; hudText!:Phaser.GameObjects.Text; healthIcons:Phaser.GameObjects.Image[]=[]; grenadeIcons:Phaser.GameObjects.Image[]=[]; bossBar!:Phaser.GameObjects.Rectangle; bossBarBg!:Phaser.GameObjects.Rectangle; prompt!:Phaser.GameObjects.Text; rng=0xBAADF00D;
 constructor(){super('Game');}
 create(){
  this.resetRun();
  this.physics.world.setBounds(0,0,WORLD,FLOOR+45);
  this.add.image(0,0,'boss-sky').setOrigin(0).setScrollFactor(.12).setDepth(-20);
  this.add.image(0,0,'scenery').setOrigin(0).setDepth(-10);
  const far=new Phaser.GameObjects.TileSprite(this,0,0,WORLD,140,'scenery'); far.setOrigin(0).setPosition(0,72).setTileScale(1.8).setAlpha(.14).setDepth(-9);this.add.existing(far); far.setScrollFactor(.35,0);
  this.add.image(4160,2,'hall').setOrigin(0).setDepth(-8);
  this.add.rectangle(WORLD/2,FLOOR+35,WORLD,90,0x2b3535).setDepth(-5);
  this.add.rectangle(WORLD/2,FLOOR,WORLD,3,0xa69b7e).setDepth(-4);
  for(let x=120;x<WORLD;x+=210)this.add.rectangle(x,FLOOR+24,42,2,0x9d9779,.75).setDepth(-3);
  this.add.rectangle(0,FLOOR+35,WORLD,52,0x152020,.36).setDepth(5);
  this.player=this.physics.add.sprite(80,FLOOR-16,'player-0').setDepth(8).setCollideWorldBounds(true).setGravityY(680).setSize(12,26).setOffset(6,5).setMaxVelocity(205,520);
  this.bullets=this.physics.add.group({defaultKey:'bullet',maxSize:28});this.hostiles=this.physics.add.group({maxSize:18});this.hostileShots=this.physics.add.group({defaultKey:'acid',maxSize:16});this.grenades=this.physics.add.group({defaultKey:'grenade',maxSize:5});this.effects=this.physics.add.group({maxSize:50});
  this.physics.add.overlap(this.bullets,this.hostiles,this.hitEnemy,undefined,this);this.physics.add.overlap(this.player,this.hostiles,this.touchEnemy,undefined,this);this.physics.add.overlap(this.player,this.hostileShots,this.hitPlayer,undefined,this);
  this.cameras.main.setBounds(0,0,WORLD,H).startFollow(this.player,true,.11,.1).setDeadzone(120,40);
  this.keys=Object.fromEntries(['A','D','W','SPACE','J','K','P','ESC','M','ENTER'].map(k=>[k,this.input.keyboard!.addKey(k)])) as Record<string,Phaser.Input.Keyboard.Key>;
  this.makeHUD();
  const ground=this.physics.add.staticImage(WORLD/2,FLOOR+24,'bullet').setVisible(false).setDisplaySize(WORLD,48).refreshBody();this.ground=(ground.body as Phaser.Physics.Arcade.StaticBody);
  this.physics.add.collider(this.player,ground);this.physics.add.collider(this.hostiles,ground);
  this.createTraversalPlatforms();
  this.physics.add.collider(this.bullets,ground,this.destroyOnImpact,undefined,this);
  this.physics.add.collider(this.player,this.platforms);this.physics.add.collider(this.hostiles,this.platforms,this.enemyBlocked,undefined,this);this.physics.add.collider(this.bullets,this.platforms,this.destroyOnImpact,undefined,this);this.physics.add.collider(this.hostileShots,this.platforms,this.destroyOnImpact,undefined,this);this.physics.add.collider(this.grenades,this.platforms);
  this.physics.add.collider(this.grenades,ground);
  this.physics.add.collider(this.hostileShots,ground,this.destroyOnImpact,undefined,this);

  this.input.keyboard!.on('keydown-M',()=>{AudioBus.toggle();this.updateHud();});
  this.input.keyboard!.on('keydown-ESC',()=>{this.paused=!this.paused;this.updateHud();});
  this.input.keyboard!.on('keydown-P',()=>{this.paused=!this.paused;this.updateHud();});
  this.input.keyboard!.on('keydown-ENTER',()=>{if(this.complete||this.health<=0)this.scene.restart();});
  this.time.addEvent({delay:12500,loop:true,callback:()=>this.ambientFx()});
  this.updateHud();
 }
 resetRun(){this.health=5;this.ammo=4;this.kills=0;this.elapsed=0;this.jumpBufferedUntil=0;this.lastGroundedAt=-Infinity;this.lastFire=0;this.lastGrenade=0;this.lastDamage=-Infinity;this.paused=false;this.boss=null;this.bossHp=0;this.bossPhase=0;this.bossAtk=0;this.locked.clear();this.touchingEnemies.clear();this.spawned.clear();this.complete=false;this.section='RESIDENTIAL BELFAST';this.rng=0xBAADF00D;this.healthIcons=[];this.grenadeIcons=[];}
 createTraversalPlatforms(){
  this.platforms=this.physics.add.staticGroup();
  // Collide against the four wrecked taxi roofs already painted into the scenery texture.
  for(const x of [510,1140,2040,3160]){this.addTraversalPlatform(x+34,190,68,6,false);this.addTraversalPlatform(x+3,207,6,34,false);this.addTraversalPlatform(x+65,207,6,34,false);}
  // Simple Belfast-style shelters give the route visible, reachable raised ground.
  for(const x of [820,2480,3650]){
   this.add.rectangle(x,FLOOR-37,82,4,0x7a7769).setDepth(4);
   this.add.rectangle(x-37,FLOOR-19,3,36,0x666f68,.9).setDepth(4);
   this.add.rectangle(x+37,FLOOR-19,3,36,0x666f68,.9).setDepth(4);
   this.add.rectangle(x,FLOOR-19,69,31,0x526362,.22).setStrokeStyle(1,0x929381,.8).setDepth(3);
   this.add.rectangle(x,FLOOR-4,45,3,0x534a3d).setDepth(4);
   this.addTraversalPlatform(x,FLOOR-37,78,6,true);this.addTraversalPlatform(x-37,FLOOR-20,4,40,false);this.addTraversalPlatform(x+37,FLOOR-20,4,40,false);
  }
 }
 addTraversalPlatform(x:number,y:number,width:number,height:number,visible:boolean){
  const surface=this.add.rectangle(x,y,width,height,0x9a8765,visible?1:0).setDepth(5);
  this.physics.add.existing(surface,true);this.platforms.add(surface);
 }
 destroyOnImpact(first:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,second:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){const projectile=(((first as AnySprite).body as Phaser.Physics.Arcade.Body|undefined)?.moves?first:second) as AnySprite;projectile.destroy();}
 enemyBlocked(first:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,second:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){const e=((((first as AnySprite).body as Phaser.Physics.Arcade.Body|undefined)?.moves?first:second)) as AnySprite,b=e.body as Phaser.Physics.Arcade.Body;if((b.blocked.left||b.blocked.right||b.touching.left||b.touching.right)&&b.velocity.y>=0){e.setVelocityY(-255);}}
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
  this.prompt.setText(`A / D MOVE     SPACE JUMP     J FIRE     K GRENADE     P PAUSE     M MUTE`);
  if(this.paused){this.showOverlay('PAUSED','P OR ESC  RESUME     ENTER  RESTART');}else if(this.complete){this.showOverlay('BELFAST STANDS','VICTORY  //  PRESS ENTER TO PLAY AGAIN');}else if(this.health<=0){this.showOverlay('YOU FELL IN BELFAST','PRESS ENTER TO TRY AGAIN');}else this.overlay.setVisible(false);
 }
 showOverlay(title:string,sub:string){this.overlay.removeAll(true);this.overlay.setVisible(true);this.overlay.add(this.add.rectangle(0,0,288,94,0x11191a,.95).setStrokeStyle(1,0xa98c57).setInteractive({useHandCursor:true}).on('pointerup',()=>this.scene.restart()));this.overlay.add(this.add.text(0,-19,title,{fontFamily:'Arial Black, sans-serif',fontSize:'19px',fontStyle:'bold',color:'#e0ad5e',stroke:'#322820',strokeThickness:2}).setOrigin(.5));this.overlay.add(this.add.text(0,17,sub,{fontFamily:'monospace',fontSize:'7px',color:'#e1dfcc',letterSpacing:1}).setOrigin(.5));}
 sectionAt(x:number){return x<1450?'RESIDENTIAL BELFAST':x<3050?'CITY CENTRE':'CITY HALL';}
 rand(){this.rng=(this.rng*1664525+1013904223)>>>0;return this.rng/4294967296;}
 update(_t:number,dt:number){
  if(this.health<=0||this.complete)return;if(this.paused)return;
  const d=Math.min(dt,40),now=this.elapsed*1000+d;this.elapsed+=d/1000;const x=this.player.x;this.section=this.sectionAt(x);
  this.pruneTouchContacts();
  const body=this.player.body as Phaser.Physics.Arcade.Body, grounded=body.blocked.down||body.touching.down;
  if(grounded)this.lastGroundedAt=now;
  const left=this.keys.A.isDown,right=this.keys.D.isDown,dir=left===right?0:left?-1:1;
  if(dir)this.player.setFlipX(dir<0);
  const target=dir*128,current=body.velocity.x,rate=dir?(Math.sign(current)&&Math.sign(current)!==dir?1750:900):1450;
  const step=rate*d/1000;this.player.setVelocityX(Math.abs(target-current)<=step?target:current+Math.sign(target-current)*step);
  if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE)||Phaser.Input.Keyboard.JustDown(this.keys.W))this.jumpBufferedUntil=now+140;
  const canJump=grounded||now-this.lastGroundedAt<=150;
  if(now<=this.jumpBufferedUntil&&canJump){this.jumpBufferedUntil=0;this.lastGroundedAt=-Infinity;this.player.setVelocityY(-320);AudioBus.play(330,.07,'triangle',.03);}
  if((Phaser.Input.Keyboard.JustUp(this.keys.SPACE)||Phaser.Input.Keyboard.JustUp(this.keys.W))&&body.velocity.y<-120)this.player.setVelocityY(-120);
  if(Phaser.Input.Keyboard.JustDown(this.keys.J))this.fire();if(Phaser.Input.Keyboard.JustDown(this.keys.K))this.throwGrenade();
  this.animatePlayer();this.waveCheck(x);this.updateEnemies(d);this.updateObjects(d);this.updateBoss(d);this.updateHud();
 }
 animatePlayer(){const v=Math.abs(this.player.body!.velocity.x);const f=Math.floor(this.elapsed*11)%4;let ix=0;if(this.player.body!.velocity.y<-30)ix=1;else if(v>12)ix=[0,1,2,1][f];if(this.elapsed*10%3<1)ix=2;this.player.setTexture(`player-${ix}`);}
 fire(){if(this.elapsed*1000-this.lastFire<180)return;this.lastFire=this.elapsed*1000;const dir=this.player.flipX?-1:1,b=this.bullets.get(this.player.x+dir*17,this.player.y-2,'bullet') as AnySprite|null;if(!b)return;b.setActive(true).setVisible(true).setDepth(12).setFlipX(dir<0);b.body?.reset(b.x,b.y);b.setVelocityX(dir*430);b.setVelocityY(0);(b.body as Phaser.Physics.Arcade.Body).allowGravity=false;b.setData('life',0);this.fx(this.player.x+dir*13,this.player.y-5,'flash');AudioBus.play(500,.035,'square',.035);}
 throwGrenade(){if(!this.ammo||this.elapsed*1000-this.lastGrenade<500)return;this.lastGrenade=this.elapsed*1000;this.ammo--;const dir=this.player.flipX?-1:1,g=this.grenades.get(this.player.x+dir*13,this.player.y-5,'grenade') as AnySprite|null;if(g){g.setActive(true).setVisible(true).setDepth(12);g.body?.reset(g.x,g.y);g.setGravityY(680);g.setVelocity(dir*140,-260);g.setBounce(.55);g.setData('life',0);}AudioBus.play(140,.1,'triangle',.06);}
 waveCheck(x:number){
  const waves=[{at:460,types:['shambler','shambler']},{at:880,types:['shambler','shambler','shambler']},{at:1280,types:['runner','shambler','shambler']},{at:1740,types:['runner','runner','shambler']},{at:2180,types:['spitter','runner','shambler']},{at:2630,types:['spitter','runner','runner','shambler']},{at:3090,types:['spitter','runner','spitter']},{at:3520,types:['runner','runner','spitter']},{at:3910,types:['spitter','runner','shambler']},{at:4150,types:['shambler','runner']}];
  for(let i=0;i<waves.length;i++){const w=waves[i]!;if(x>w.at&&!this.spawned.has(i)){this.spawned.add(i);w.types.forEach((type,j)=>this.spawnEnemy(w.at+j*39,type));}}
  if(x>1410&&!this.locked.has(0)){this.locked.add(0);this.banner('SECTION II  /  CITY CENTRE');}
  if(x>3005&&!this.locked.has(1)){this.locked.add(1);this.banner('SECTION III  /  CITY HALL');}
  if(x>3995&&!this.locked.has(2)){this.locked.add(2);this.startBoss();}
 }
 spawnEnemy(x:number,type:string){const side=this.rand()<.48?-1:1;const spawnX=x+(side<0?-200:220);const e=this.hostiles.get(spawnX,FLOOR-16,`${type}-0`) as AnySprite|null;if(!e)return;this.touchingEnemies.delete(e);e.setActive(true).setVisible(true).setDepth(9).setSize(13,25).setOffset(5,6).setCollideWorldBounds(true).setGravityY(680).setVelocityX(0);(e.body as Phaser.Physics.Arcade.Body).allowGravity=true;e.setData({kind:type,hp:type==='shambler'?4:type==='runner'?2:3,attack:0,frame:0,hit:0,dead:false});}
 updateEnemies(_d:number){for(const e of this.hostiles.getChildren() as AnySprite[]){if(!e.active)continue;const k=e.getData('kind') as string,dx=this.player.x-e.x,dir=Math.sign(dx),dist=Math.abs(dx);let spd=k==='runner'?91:k==='spitter'?25:39;if(k==='spitter'){
  if(dist<245&&dist>80){e.setVelocityX(0);const attack=e.getData('attack') as number;if(this.elapsed*1000-attack>2050){e.setData('attack',this.elapsed*1000);this.acid(e,dir);}}else e.setVelocityX(dir*spd);
 }else e.setVelocityX(dir*spd);
 e.setFlipX(dir<0);const f=Math.floor(this.elapsed*(k==='runner'?13:7))%4;e.setTexture(`${k}-${f}`);
 if(this.elapsed*1000-(e.getData('hit') as number)<100)e.setTint(0xffffff);else e.clearTint();
 }}
 acid(e:AnySprite,dir:number){const p=this.hostileShots.get(e.x+dir*15,e.y-4,'acid') as AnySprite|null;if(!p)return;p.setActive(true).setVisible(true).setDepth(11);p.body?.reset(p.x,p.y);p.setVelocity(dir*115,-20);p.setData('life',0);AudioBus.play(185,.09,'sawtooth',.025);}
 hitEnemy(b:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,e:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){const bullet=b as AnySprite,enemy=e as AnySprite;if(!bullet.active||!enemy.active)return;bullet.destroy();const hp=(enemy.getData('hp') as number)-1;enemy.setData('hp',hp);enemy.setData('hit',this.elapsed*1000);this.fx(enemy.x,enemy.y-6,'hit');if(hp<=0)this.killEnemy(enemy);}
 killEnemy(e:AnySprite){e.disableBody(true,true);this.kills++;this.fx(e.x,e.y-5,'death');AudioBus.play(100,.16,'triangle',.04);if(this.rand()<.16&&this.ammo<4){this.ammo++;this.fx(e.x,e.y-14,'pickup');}}
 touchEnemy(_p:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,e:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){const enemy=e as AnySprite;if(this.touchingEnemies.has(enemy))return;if(this.damage(1,enemy.x))this.touchingEnemies.add(enemy);}
 pruneTouchContacts(){const p=this.player.body as Phaser.Physics.Arcade.Body;for(const e of this.touchingEnemies){if(!e.active){this.touchingEnemies.delete(e);continue;}const b=e.body as Phaser.Physics.Arcade.Body;if(p.right<=b.left||p.left>=b.right||p.bottom<=b.top||p.top>=b.bottom)this.touchingEnemies.delete(e);}}
 hitPlayer(p:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){(p as AnySprite).destroy();this.damage(1,this.player.x);}
 damage(n:number,x:number):boolean{const now=this.elapsed*1000;if(now-this.lastDamage<1100||this.health<=0)return false;this.lastDamage=now;this.health=Math.max(0,this.health-n);const away=Math.sign(this.player.x-x)||(this.player.flipX?1:-1);this.player.setVelocityX(away*145);const body=this.player.body as Phaser.Physics.Arcade.Body;if(body.blocked.down||body.touching.down)this.player.setVelocityY(-105);this.player.setTintFill(0xffffff);this.time.delayedCall(120,()=>this.player.clearTint());this.cameras.main.shake(160,.008);AudioBus.play(75,.18,'sawtooth',.055);this.fx(x,this.player.y,'hit');this.updateHud();return true;}
 hitBoss(b:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile,_bb:Phaser.Types.Physics.Arcade.GameObjectWithBody|Phaser.Physics.Arcade.Body|Phaser.Physics.Arcade.StaticBody|Phaser.Tilemaps.Tile){const bullet=b as AnySprite;if(!bullet.active||!this.boss?.active)return;bullet.destroy();this.bossHp--;this.boss?.setTintFill(0xffffff);this.time.delayedCall(90,()=>this.boss?.clearTint());this.fx(this.boss!.x+(this.rand()-.5)*35,this.boss!.y-5,'hit');this.cameras.main.shake(65,.002);this.updateBossHud();if(this.bossHp<=0){if(this.bossPhase===0){this.bossPhase=1;this.bossHp=30;this.banner('IT IS RISING AGAIN');this.boss!.setTint(0x83a276);this.updateBossHud();}else this.win();}}
 startBoss(){this.banner('THE CITY HALL // SOMETHING STIRS');this.boss=this.physics.add.sprite(4320,FLOOR-44,'zombie-large-0').setDepth(10).setCollideWorldBounds(true).setGravityY(680).setSize(45,69).setOffset(13,12);this.boss.setScale(1.1);this.bossHp=46;this.bossPhase=0;this.physics.add.overlap(this.bullets,this.boss,this.hitBoss,undefined,this);this.physics.add.collider(this.boss,this.ground.gameObject);this.bossAtk=this.elapsed*1000;this.bossBarBg.setVisible(true);this.bossBar.setVisible(true);this.updateBossHud();this.cameras.main.shake(500,.009);AudioBus.play(48,.5,'sawtooth',.06);}
 updateBossHud(){if(!this.boss)return;const max=this.bossPhase===0?46:30;this.bossBar.width=Math.max(0,210*this.bossHp/max);this.bossBar.setFillStyle(this.bossPhase===1?0xb7b35e:0xd0523e);}
 updateBoss(_d:number){const b=this.boss;if(!b?.active)return;const dir=Math.sign(this.player.x-b.x),dist=Math.abs(this.player.x-b.x),phase=this.bossPhase;const interval=phase===0?2400:1600;
  if(dist>80)b.setVelocityX(dir*(phase===0?30:54));else b.setVelocityX(0);
  if(this.elapsed*1000-this.bossAtk>interval){this.bossAtk=this.elapsed*1000;if(phase===0){this.banner('INCOMING  /  DODGE THE STRIKE');const targetX=this.player.x;this.time.delayedCall(750,()=>{if(!this.boss?.active)return;for(let j=-1;j<=1;j++)this.fx(targetX+j*27,FLOOR-4,'impact');this.cameras.main.shake(220,.009);if(Math.abs(this.player.x-targetX)<52)this.damage(1,targetX);});}else{this.banner('IT SPITS ACROSS THE STREET');for(const offset of [-.22,0,.22]){const p=this.hostileShots.get(b.x+dir*28,b.y-25,'acid') as AnySprite|null;if(p){p.setActive(true).setVisible(true);p.body?.reset(p.x,p.y);p.setVelocity(dir*155,offset*230);}}}}
  b.setFlipX(dir<0).setTexture(`zombie-large-${Math.floor(this.elapsed*4)%3}`);
 }
 win(){this.complete=true;this.boss?.disableBody(true,true);this.bossBarBg.setVisible(false);this.bossBar.setVisible(false);this.cameras.main.flash(650,245,219,155);this.cameras.main.shake(400,.012);this.banner('BELFAST STANDS');for(let i=0;i<7;i++)this.time.delayedCall(i*115,()=>this.fx(this.boss?.x??4320,FLOOR-15,'impact'));AudioBus.play(660,.4,'triangle',.08);this.updateHud();}
 banner(t:string){this.centerText.setText(t).setAlpha(1).setScale(1.12);this.tweens.add({targets:this.centerText,alpha:0,scale:1,duration:1600,ease:'Cubic.easeOut'});}
 fx(x:number,y:number,kind:string){
  if(kind==='flash'){const im=this.add.image(x,y,'fire-0').setDepth(14);this.tweens.add({targets:im,alpha:0,scaleX:1.5,scaleY:1.5,duration:100,onComplete:()=>im.destroy()});return;}
  const count=kind==='impact'?11:kind==='death'?8:kind==='pickup'?4:4;for(let i=0;i<count;i++){const p=this.effects.get(x,y,`smoke-${i%4}`) as AnySprite|null;if(!p)continue;p.setTexture(kind==='impact'?`fire-${i%7}`:`smoke-${i%4}`).setActive(true).setVisible(true).setDepth(14).setScale(kind==='impact'?1.2:.75+this.rand()*.7);p.body?.reset(x,y);(p.body as Phaser.Physics.Arcade.Body).allowGravity=true;p.setVelocity((this.rand()-.5)*(kind==='impact'?180:100),-this.rand()*(kind==='impact'?175:95));p.setData('life',0);}
 }
 updateObjects(dt:number){
  for(const group of [this.bullets,this.grenades,this.hostileShots,this.effects])for(const s of group.getChildren() as AnySprite[]){if(!s.active)continue;const life=(s.getData('life') as number||0)+dt;s.setData('life',life);
   if(group===this.bullets){if(life>920||s.x<0||s.x>WORLD)s.destroy();}
   else if(group===this.grenades){if(life>1250){this.explode(s.x,s.y);s.destroy();}}
   else if(group===this.hostileShots){if(life>1840||s.x<0||s.x>WORLD)s.destroy();}
   else if(life>370)s.destroy();
  }
 }
 explode(x:number,y:number){this.cameras.main.shake(180,.006);this.fx(x,y,'impact');AudioBus.play(95,.16,'sawtooth',.07);for(const e of this.hostiles.getChildren() as AnySprite[])if(e.active&&Phaser.Math.Distance.Between(x,y,e.x,e.y)<70)this.killEnemy(e);if(this.boss?.active&&Phaser.Math.Distance.Between(x,y,this.boss.x,this.boss.y)<95){this.bossHp-=3;this.updateBossHud();if(this.bossHp<=0){if(this.bossPhase===0){this.bossPhase=1;this.bossHp=30;this.banner('IT IS RISING AGAIN');this.boss.setTint(0x83a276);this.updateBossHud();}else this.win();}}}
 ambientFx(){if(this.health<=0||this.complete)return;const cx=this.cameras.main.scrollX;const x=cx+this.rand()*W;const s=this.add.rectangle(x,FLOOR-1,1,5+this.rand()*12,0xbec6b0,.18).setDepth(13);this.tweens.add({targets:s,y:s.y+14,alpha:0,duration:500,onComplete:()=>s.destroy()});}
}

const game=new Phaser.Game({type:Phaser.CANVAS,width:W,height:H,parent:'game',backgroundColor:'#101719',pixelArt:true,antialias:false,roundPixels:true,physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},scene:[Boot,Title,Game],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{pixelArt:true,antialias:false,roundPixels:true}});
if (new URLSearchParams(location.search).has('test')) {
  Object.defineProperty(window, '__belfast', { value: { scene: (key: string) => game.scene.getScene(key), fps: () => game.loop.actualFps }, configurable: true });
}
window.addEventListener('pagehide',()=>game.destroy(true));
