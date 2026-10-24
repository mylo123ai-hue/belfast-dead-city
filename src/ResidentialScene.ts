import Phaser from 'phaser';
import threeHouseFacades from './assets/v7-1-three-house-facades.png';
import v72EastBelfastDusk from './assets/v7-2-east-belfast-dusk.png';
import v72ResidentialGround from './assets/v7-2-residential-ground.png';

/**
 * V7's environment-only residential benchmark. All street geometry lives in
 * world space; only the distant skyline uses camera parallax. No combat,
 * pickups, platforms, hazards, or gameplay props are created in this scene.
 */
export default class ResidentialScene extends Phaser.Scene {
  static readonly WORLD_WIDTH = 14500; // 100 seconds at the existing 145 unit/s run speed.
  static readonly VIEW_WIDTH = 480;
  static readonly VIEW_HEIGHT = 270;
  static readonly STREET_LEVEL = 225;
  static readonly PLAYER_HEIGHT = 32;

  player!: Phaser.Physics.Arcade.Sprite;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  rain: Phaser.GameObjects.Rectangle[] = [];
  rng = 0xB31FA57;
  elapsed = 0;
  stageArtMode = false;
  environmentArtMode = false;

  constructor() { super('ResidentialScene'); }

  preload() {
    const benchmark = new URLSearchParams(location.search).get('benchmark');
    if (benchmark === 'v7.1' || benchmark === 'v7.2')
      this.load.image('v7.1-three-house-facades', threeHouseFacades);
    if (benchmark === 'v7.2') {
      this.load.image('v7.2-east-belfast-dusk', v72EastBelfastDusk);
      this.load.image('v7.2-residential-ground', v72ResidentialGround);
    }
  }

  create() {
    const world = ResidentialScene.WORLD_WIDTH;
    const w = ResidentialScene.VIEW_WIDTH;
    const h = ResidentialScene.VIEW_HEIGHT;
    const benchmark = new URLSearchParams(location.search).get('benchmark');
    const v71Stage = benchmark === 'v7.1';
    const v72Stage = benchmark === 'v7.2';
    this.stageArtMode = v71Stage || v72Stage;
    this.environmentArtMode = v72Stage;
    this.physics.world.setBounds(0, 0, world, h);
    this.cameras.main.setBounds(0, 0, world, h);

    const skylineWidth = Math.ceil(world * 0.32 + w);
    const distant = this.textures.createCanvas('v7-distant-skyline', skylineWidth, 190)!;
    const distantContext = distant.getContext();
    drawDistantSkyline(distantContext, skylineWidth, this.hash.bind(this));
    if (v72Stage) {
      const skySource = this.textures.get('v7.2-east-belfast-dusk').getSourceImage() as CanvasImageSource;
      composeV72ParallaxSky(distantContext, skySource);
    }
    distant.refresh();
    this.add.image(0, 0, 'v7-distant-skyline').setOrigin(0).setDepth(-20).setScrollFactor(0.32, 0.2);

    const street = this.textures.createCanvas('v7-residential-panorama', world, h)!;
    const streetContext = street.getContext();
    drawResidentialPanorama(streetContext, world, this.hash.bind(this));
    if (v71Stage || v72Stage) streetContext.clearRect(0, 0, 580, 205);
    street.refresh();
    this.add.image(0, 0, 'v7-residential-panorama').setOrigin(0).setDepth(-10);

    if (v71Stage || v72Stage) {
      const facadeSource = this.textures.get('v7.1-three-house-facades').getSourceImage() as CanvasImageSource;
      const facade = this.textures.createCanvas('v7.1-facade-composite', 600, 146)!;
      const facadeContext = facade.getContext();
      facadeContext.imageSmoothingEnabled = false;
      facadeContext.drawImage(facadeSource, 0, 0, 600, 146);
      facadeContext.globalCompositeOperation = 'destination-in';
      const edgeFade = facadeContext.createLinearGradient(580, 0, 600, 0);
      edgeFade.addColorStop(0, 'rgba(255,255,255,1)'); edgeFade.addColorStop(1, 'rgba(255,255,255,0)');
      facadeContext.fillStyle = edgeFade; facadeContext.fillRect(0, 0, 600, 146);
      facadeContext.globalCompositeOperation = 'source-over'; facade.refresh();
      this.add.image(0, 59, 'v7.1-facade-composite').setOrigin(0).setDepth(-9);
      this.drawThreeHouseFrontage();
    }

    if (v72Stage) this.add.image(0, 205, 'v7.2-residential-ground').setOrigin(0).setDepth(0);

    this.createWalkerTextures();

    this.createStreetLighting();
    this.player = this.physics.add.sprite(78, ResidentialScene.STREET_LEVEL - ResidentialScene.PLAYER_HEIGHT / 2, 'v7-walker-0')
      .setDepth(10).setCollideWorldBounds(true).setGravityY(680).setMaxVelocity(185, 520)
      .setSize(19, 30).setOffset(2, 1);
    const ground = this.physics.add.staticImage(world / 2, ResidentialScene.STREET_LEVEL + 24, 'bullet')
      .setVisible(false).setDisplaySize(world, 48).refreshBody();
    this.physics.add.collider(this.player, ground);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.08).setDeadzone(120, 36);

    this.keys = Object.fromEntries(['A', 'D', 'W', 'SPACE'].map((key) =>
      [key, this.input.keyboard!.addKey(key)])) as Record<string, Phaser.Input.Keyboard.Key>;
    this.add.text(9, 8, 'BELFAST  /  RESIDENTIAL STREET  /  ENVIRONMENT BENCHMARK', {
      fontFamily: 'monospace', fontSize: '6px', color: '#d6cba9', backgroundColor: '#111b20aa',
      padding: { x: 4, y: 3 }, letterSpacing: 0.5,
    }).setScrollFactor(0).setDepth(30).setAlpha(0.8);
    this.add.text(w - 9, 8, 'A / D WALK   SPACE JUMP', {
      fontFamily: 'monospace', fontSize: '6px', color: '#c0c9b4', backgroundColor: '#111b20aa',
      padding: { x: 4, y: 3 }, letterSpacing: 0.4,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(30).setAlpha(0.8);
    this.makeRain();
    this.time.addEvent({ delay: 560, loop: true, callback: () => this.steamPuff() });
  }

  update(_time: number, delta: number) {
    const d = Math.min(delta, 40);
    this.elapsed += d / 1000;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const direction = (this.keys.D.isDown ? 1 : 0) - (this.keys.A.isDown ? 1 : 0);
    if (direction) {
      body.setVelocityX(direction * 145);
      this.player.setFlipX(direction < 0);
    } else body.setVelocityX(body.velocity.x * 0.78);

    if ((Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.W)) && body.blocked.down)
      body.setVelocityY(-315);
    if (Math.abs(body.velocity.x) > 28) this.player.setTexture(`v7-walker-${Math.floor(this.elapsed * 9) % 2 ? 1 : 2}`);
    else this.player.setTexture('v7-walker-0');

    for (const drop of this.rain) {
      drop.x -= 12 * d / 1000;
      drop.y += (drop.getData('speed') as number) * d / 1000;
      if (drop.y > ResidentialScene.VIEW_HEIGHT + 10) {
        drop.y = -this.rand() * 22;
        drop.x = this.cameras.main.scrollX + this.rand() * ResidentialScene.VIEW_WIDTH;
      }
      if (drop.x < this.cameras.main.scrollX - 8) drop.x = this.cameras.main.scrollX + ResidentialScene.VIEW_WIDTH + this.rand() * 12;
    }
  }

  createStreetLighting() {
    for (const x of [138, 420, 770, 1055, 1390, 1775, 2145, 2510, 2840, 3205, 3545, 3890, 4230, 4590, 4935, 5280, 5650, 5980, 6340, 6690, 7040, 7410, 7780, 8140, 8490, 8860, 9220, 9560, 9930, 10280, 10650, 11020, 11380, 11720, 12080, 12430, 12790, 13150, 13520, 13880, 14220]) {
      const glow = this.add.ellipse(x, 142, 66, 124, 0xf0b466, 0.12).setBlendMode(Phaser.BlendModes.ADD).setDepth(-8);
      this.tweens.add({ targets: glow, alpha: { from: 0.075, to: 0.16 }, duration: 900 + (x % 700), yoyo: true, repeat: -1 });
    }
    for (const x of [138, 420, 770, 1055, 1390, 1775, 2145, 2510, 2840, 3205, 3545, 3890, 4230, 4590, 4935, 5280, 5650, 5980, 6340, 6690, 7040, 7410, 7780, 8140, 8490, 8860, 9220, 9560, 9930, 10280, 10650, 11020, 11380, 11720, 12080, 12430, 12790, 13150, 13520, 13880, 14220]) {
      this.add.rectangle(x, 169, 2, 77, 0x263235).setDepth(-7);
      this.add.rectangle(x - 7, 129, 15, 3, 0x263235).setDepth(-7);
      this.add.rectangle(x, 126, 7, 5, 0xd9bd85).setDepth(-6).setAlpha(0.8);
    }
  }

  drawThreeHouseFrontage() {
    const g = this.add.graphics().setDepth(1);
    const houses = [
      { left: 0, gateLeft: 157, gateRight: 193 },
      { left: 200, gateLeft: 357, gateRight: 393 },
      { left: 400, gateLeft: 538, gateRight: 574 },
    ];
    for (const house of houses) {
      // Decorative low sandstone walls and open iron gates sit behind the walker.
      g.fillStyle(0x555b55, 1); g.fillRect(house.left + 3, 199, house.gateLeft - house.left - 3, 6);
      g.fillRect(house.gateRight, 199, Math.max(0, house.left + 199 - house.gateRight), 6);
      g.fillStyle(0xc0ad89, 1); g.fillRect(house.left + 3, 198, house.gateLeft - house.left - 3, 2);
      g.fillRect(house.gateRight, 198, Math.max(0, house.left + 199 - house.gateRight), 2);
      g.fillStyle(0x303c3b, 1); g.fillRect(house.gateLeft, 200, 2, 5); g.fillRect(house.gateRight - 2, 200, 2, 5);
      g.fillRect(house.gateLeft + 6, 200, 1, 5); g.fillRect(house.gateLeft + 13, 200, 1, 5);
      g.fillRect(house.gateLeft + 20, 200, 1, 5); g.fillRect(house.gateLeft + 27, 200, 1, 5);
      g.fillStyle(0x918775, 1); g.fillRect(house.left + 2, 204, 4, 1); g.fillRect(house.left + 195, 204, 4, 1);
    }
  }

  createWalkerTextures() {
    for (let frame = 0; frame < 3; frame++) {
      const texture = this.textures.createCanvas(`v7-walker-${frame}`, 24, 32)!;
      const c = texture.getContext(); c.imageSmoothingEnabled = false;
      const px = (x: number, y: number, w: number, h: number, color: string) => {
        c.fillStyle = color; c.fillRect(x, y, w, h);
      };
      px(4, 29, 16, 2, '#11191a'); // soft ground shadow
      px(7, 25 + (frame === 1 ? 2 : 0), 5, 4, '#282f2d');
      px(14, 25 + (frame === 2 ? 2 : 0), 5, 4, '#2a302d');
      px(7, 21, 5, 5, '#4f554d'); px(14, 21, 5, 5, '#454d49');
      px(7, 11, 12, 12, '#465b57'); px(5, 13, 3, 9, '#394844'); px(18, 14, 3, 8, '#394944');
      px(8, 12, 10, 2, '#72827a'); px(8, 19, 10, 1, '#303e3a');
      px(9, 5, 9, 8, '#c4a17e'); px(8, 4, 11, 3, '#28393a');
      px(7, 3, 13, 2, '#6c7770'); px(6, 2, 15, 1, '#9a9179'); // rain hood
      px(11, 7, 1, 1, '#1e2928'); px(15, 7, 1, 1, '#1e2928');
      px(4, 15, 3, 8, '#3e504b'); px(19, 15, 2, 8, '#42534e');
      px(3, 21, 4, 3, '#4d554b'); px(18, 21, 4, 3, '#4d554b'); // hands at sides
      texture.refresh();
    }
  }

  makeRain() {
    for (let i = 0; i < 42; i++) {
      const drop = this.add.rectangle(this.cameras.main.scrollX + this.rand() * 480, this.rand() * 270,
        1, 5 + this.rand() * 6, i % 5 ? 0xa9c9c6 : 0xe0c790, 0.2 + this.rand() * 0.18).setAngle(-12).setDepth(16);
      drop.setData('speed', 105 + this.rand() * 95);
      this.rain.push(drop);
    }
  }

  steamPuff() {
    if (this.rand() > 0.46) return;
    const x = this.cameras.main.scrollX + 30 + this.rand() * 420;
    const puff = this.add.ellipse(x, 202, 4, 3, 0x899694, 0.22).setDepth(1);
    this.tweens.add({ targets: puff, y: 180, x: x + (this.rand() - 0.5) * 10, scale: 2.3, alpha: 0,
      duration: 2200 + this.rand() * 1200, onComplete: () => puff.destroy() });
  }

  rand() { this.rng = (this.rng * 1664525 + 1013904223) >>> 0; return this.rng / 4294967296; }
  hash(n: number) { let value = (Math.imul(n | 0, 1664525) + 1013904223) >>> 0; value ^= value >>> 16; return value / 4294967296; }
}

function drawDistantSkyline(c: CanvasRenderingContext2D, width: number, hash: (n: number) => number) {
  c.imageSmoothingEnabled = false;
  const sky = c.createLinearGradient(0, 0, 0, 190);
  sky.addColorStop(0, '#172a38'); sky.addColorStop(0.55, '#34454e'); sky.addColorStop(1, '#6b6b63');
  c.fillStyle = sky; c.fillRect(0, 0, width, 190);
  for (let x = 0, i = 0; x < width; x += 190, i++) {
    const n = hash(i + 811);
    if (n > 0.32) {
      c.fillStyle = 'rgba(24,43,54,.25)'; c.fillRect(x, 34 + Math.floor(hash(i + 27) * 38), 66 + Math.floor(n * 82), 2);
      c.fillStyle = 'rgba(113,126,125,.13)'; c.fillRect(x + 12, 39 + Math.floor(hash(i + 61) * 38), 38 + Math.floor(n * 45), 1);
    }
  }
  for (let x = 0; x < width; x += 7) {
    const n = hash(x + 13);
    if (n > 0.82) { c.fillStyle = 'rgba(213,217,195,.48)'; c.fillRect(x, 29 + (x % 37), 1, 1); }
  }
  for (let x = 0, i = 0; x < width; i++) {
    const n = hash(i + 71); const w = 50 + Math.floor(n * 52); const h = 72 + Math.floor(hash(i + 17) * 57);
    const top = 163 - h;
    const facade = i % 3 ? '#435156' : '#3b4a50';
    c.fillStyle = facade; c.fillRect(x, top, w, h);
    c.fillStyle = '#27383e'; c.fillRect(x + 4, top + 4, w - 8, 2);
    if (i % 4 === 1 || i % 4 === 2) {
      c.fillStyle = '#303f44'; c.beginPath(); c.moveTo(x - 4, top + 3); c.lineTo(x + w / 2, top - 14); c.lineTo(x + w + 4, top + 3); c.closePath(); c.fill();
      c.fillStyle = '#53615d'; c.fillRect(x + w / 2 - 2, top - 16, 4, 3);
    } else {
      c.fillStyle = '#58645f'; c.fillRect(x - 3, top - 3, w + 6, 4);
    }
    for (let wx = x + 8; wx < x + w - 5; wx += 13) {
      for (let wy = top + 14; wy < 156; wy += 18) {
        const lit = hash(wx + wy + i * 31) > 0.52;
        c.fillStyle = lit ? '#b18e61' : '#667976';
        c.fillRect(wx, wy, 4, 5);
        if (lit) { c.fillStyle = '#e2bd7e'; c.fillRect(wx + 1, wy + 1, 2, 3); }
      }
    }
    x += w + 4;
  }
  // A restrained City Hall dome and shipyard crane silhouettes punctuate the skyline.
  const landmarkX = Math.floor(width * 0.64);
  c.fillStyle = '#27383e'; c.fillRect(landmarkX - 63, 125, 126, 36);
  c.fillStyle = '#59655f'; c.fillRect(landmarkX - 73, 123, 146, 4);
  c.fillRect(landmarkX - 57, 111, 7, 14); c.fillRect(landmarkX + 50, 111, 7, 14);
  c.fillRect(landmarkX - 31, 105, 62, 19); c.fillRect(landmarkX - 23, 99, 46, 7);
  c.fillRect(landmarkX - 15, 92, 30, 7); c.fillRect(landmarkX - 8, 86, 16, 7);
  c.fillRect(landmarkX - 2, 80, 4, 7);
  for (const x of [Math.floor(width * 0.32), Math.floor(width * 0.82)]) {
    c.fillStyle = '#394a4f'; c.fillRect(x, 78, 2, 86); c.fillRect(x - 25, 79, 54, 2);
    c.fillRect(x + 21, 80, 2, 21); c.fillRect(x - 25, 80, 2, 21); c.fillRect(x - 29, 100, 8, 2);
  }
}

function composeV72ParallaxSky(c: CanvasRenderingContext2D, source: CanvasImageSource) {
  // The original 1672x941 Belfast dusk painting is split into a cloud/horizon
  // plate and a distant roof/crane silhouette at the existing 1x parallax
  // pixel density. The silhouettes rise above the terrace roof line; the
  // houses hide their lower edge so they remain a distant layer.
  const overlay = document.createElement('canvas');
  overlay.width = 600; overlay.height = 190;
  const ctx = overlay.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, 1672, 720, 0, -235, 600, 330);
  ctx.drawImage(source, 0, 660, 1672, 235, 0, 43, 600, 94);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(48, 65, 78, 0.16)';
  ctx.fillRect(0, 0, 600, 190);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createLinearGradient(580, 0, 600, 0);
  fade.addColorStop(0, 'rgba(255,255,255,1)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fade; ctx.fillRect(0, 0, 600, 190);
  ctx.globalCompositeOperation = 'source-over';
  c.drawImage(overlay, 0, 0);
}

function drawResidentialPanorama(c: CanvasRenderingContext2D, width: number, hash: (n: number) => number) {
  c.imageSmoothingEnabled = false;
  // Transparent sky lets the distant skyline move at its own parallax rate
  // behind world-anchored facades.

  let x = 0; let index = 0;
  const brickColors = ['#79473e', '#70443d', '#804d42', '#704139', '#795044', '#68433d'];
  const slateColors = ['#26353a', '#303b40', '#29383d', '#344146'];
  while (x < width) {
    const seed = index * 101 + 19;
    const houseWidth = 132 + Math.floor(hash(seed) * 70);
    const floors = 2 + (hash(seed + 1) > 0.62 ? 1 : 0);
    const top = Math.max(53, 205 - floors * 38 - 15 + Math.floor(hash(seed + 2) * 17) - 8);
    const brick = brickColors[Math.floor(hash(seed + 3) * brickColors.length)]!;
    const slate = slateColors[Math.floor(hash(seed + 4) * slateColors.length)]!;
    const style = Math.floor(hash(seed + 5) * 5);
    const facadeW = houseWidth - 2;
    const groundY = 205;
    const facadeH = groundY - top;

    c.fillStyle = '#1e2729'; c.fillRect(x + 4, top + 5, facadeW, facadeH);
    c.fillStyle = brick; c.fillRect(x, top + 5, facadeW, facadeH - 5);
    c.fillStyle = '#a57b64'; c.fillRect(x - 1, top + 4, facadeW + 2, 4);
    c.fillStyle = '#b18a70'; c.fillRect(x + 2, top + 9, 3, facadeH - 12);
    c.fillStyle = '#51403a'; c.fillRect(x + facadeW - 4, top + 9, 3, facadeH - 12);

    // Gable/slate cap, eaves, chimney stacks and lead rainwater downpipes.
    c.fillStyle = slate;
    if (style === 0 || style === 1 || style === 3) {
      c.beginPath(); c.moveTo(x - 3, top + 7); c.lineTo(x + facadeW / 2, top - 16); c.lineTo(x + facadeW + 3, top + 7); c.closePath(); c.fill();
      c.fillStyle = '#485354'; c.fillRect(x + facadeW / 2 - 2, top - 17, 4, 4);
      c.strokeStyle = 'rgba(129,142,132,.38)'; c.lineWidth = 1;
      for (let tile = 0; tile < 4; tile++) {
        const dy = top - 8 + tile * 4;
        c.beginPath(); c.moveTo(x + 12, dy); c.lineTo(x + facadeW / 2 - 5, dy - 13 + tile * 3); c.stroke();
        c.beginPath(); c.moveTo(x + facadeW - 12, dy); c.lineTo(x + facadeW / 2 + 5, dy - 13 + tile * 3); c.stroke();
      }
    } else {
      c.fillRect(x - 3, top - 4, facadeW + 6, 9);
      c.fillStyle = '#485254'; c.fillRect(x - 4, top + 4, facadeW + 8, 3);
      c.fillStyle = '#1d292d'; c.fillRect(x + 9, top - 2, facadeW - 18, 2);
    }
    const chimneyX = x + 18 + Math.floor(hash(seed + 6) * (facadeW - 43));
    c.fillStyle = '#453d37'; c.fillRect(chimneyX, top - 18, 9, 16);
    c.fillStyle = '#9d795f'; c.fillRect(chimneyX - 2, top - 19, 13, 3);
    c.fillStyle = '#a07860'; c.fillRect(x + facadeW - 6, top + 7, 2, facadeH - 7);

    // Brick joints and occasional blocked/repaired patches stay subordinate to the architecture.
    for (let by = top + 12; by < groundY - 5; by += 7) {
      c.fillStyle = 'rgba(193,151,120,.34)'; c.fillRect(x + 5, by, facadeW - 10, 1);
      const stagger = (Math.floor((by - top) / 7) % 2) * 9;
      for (let bx = x + 9 + stagger; bx < x + facadeW - 7; bx += 20) c.fillRect(bx, by - 3, 1, 3);
    }

    const innerLeft = x + 14; const available = facadeW - 28;
    for (let floorIndex = 0; floorIndex < floors; floorIndex++) {
      const rowY = groundY - 18 - floorIndex * 38;
      const windowCount = available > 135 ? 3 : 2;
      const gap = available / windowCount;
      for (let wi = 0; wi < windowCount; wi++) {
        const wx = innerLeft + Math.floor(gap * wi + (gap - 18) / 2);
        const wy = rowY - (floorIndex === 0 ? 3 : 0);
        c.fillStyle = '#d0b98c'; c.fillRect(wx - 2, wy - 2, 20, 24);
        c.fillStyle = '#202d31'; c.fillRect(wx, wy, 16, 19);
        const lit = hash(seed + floorIndex * 23 + wi * 13) > 0.26;
        c.fillStyle = lit ? (hash(seed + wi) > 0.48 ? '#b8935f' : '#d0a76a') : '#415655';
        c.fillRect(wx + 2, wy + 2, 12, 15);
        if (lit) {
          c.fillStyle = hash(wx + seed) > 0.5 ? '#e4b568' : '#f1cf8b';
          c.fillRect(wx + 3, wy + 3, 4, 12); c.fillRect(wx + 8, wy + 3, 5, 12);
          c.fillStyle = '#805c41'; c.fillRect(wx + 2, wy + 10, 12, 1);
        } else { c.fillStyle = '#829084'; c.fillRect(wx + 7, wy + 2, 1, 15); }
        c.fillStyle = '#504640'; c.fillRect(wx + 1, wy + 10, 14, 1);
        c.fillStyle = '#c5ae81'; c.fillRect(wx - 2, wy + 19, 20, 3);
        c.fillStyle = '#54433b'; c.fillRect(wx - 4, wy - 4, 24, 2);
        if ((wi + floorIndex + style) % 4 === 0) {
          c.fillStyle = '#333d3d'; c.fillRect(wx - 3, wy + 4, 22, 2);
          c.fillStyle = '#9a8e72'; c.fillRect(wx - 1, wy + 6, 18, 1);
        }
      }
    }

    // Ground-level entry or restrained shop frontage; each opening bottoms at the same sill.
    const doorW = 16 + Math.floor(hash(seed + 8) * 4);
    const doorX = x + Math.floor(18 + hash(seed + 9) * Math.max(1, facadeW - 42));
    if (index % 5 === 3) {
      const shopX = x + 8; const shopW = facadeW - 16;
      c.fillStyle = '#d0bc94'; c.fillRect(shopX - 2, 169, shopW + 4, 3);
      c.fillStyle = '#292f2e'; c.fillRect(shopX, 172, shopW, 30);
      c.fillStyle = '#bd995e'; c.fillRect(shopX + 2, 174, shopW - 4, 2);
      c.fillStyle = '#b4824d'; c.fillRect(shopX + 3, 178, Math.floor((shopW - 9) / 2), 18);
      c.fillStyle = '#293a3a'; c.fillRect(shopX + 5, 180, Math.floor((shopW - 13) / 2), 14);
      c.fillStyle = '#bd995e'; c.fillRect(shopX + Math.floor(shopW / 2) + 2, 178, Math.floor((shopW - 9) / 2), 18);
      c.fillStyle = '#26383a'; c.fillRect(shopX + Math.floor(shopW / 2) + 4, 180, Math.floor((shopW - 13) / 2), 14);
      c.fillStyle = '#d5bd8d'; c.fillRect(shopX + 2, 168, shopW - 4, 2);
      c.fillStyle = '#354447'; c.fillRect(shopX + 7, 159, shopW - 14, 8);
      c.fillStyle = ['#be794a', '#c5a46b', '#708b7c'][index % 3]!; c.fillRect(shopX + 9, 161, shopW - 18, 4);
      c.fillStyle = '#eadcb6'; c.font = 'bold 4px monospace'; c.fillText(['GROCER', 'NEWS', 'OFF LICENCE'][index % 3]!, shopX + 12, 164);
    } else {
      c.fillStyle = '#d1b78a'; c.fillRect(doorX - 2, 165, doorW + 4, 41);
      c.fillStyle = '#302a28'; c.fillRect(doorX, 167, doorW, 38);
      c.fillStyle = index % 2 ? '#566357' : '#4b5045'; c.fillRect(doorX + 2, 169, doorW - 4, 34);
      c.fillStyle = '#263338'; c.fillRect(doorX + 3, 171, doorW - 6, 11);
      c.fillStyle = '#c39a60'; c.fillRect(doorX + 3, 184, doorW - 6, 1);
      c.fillStyle = '#d6b576'; c.fillRect(doorX + doorW - 5, 187, 1, 2);
      c.fillStyle = '#ba9675'; c.fillRect(doorX - 5, 205, doorW + 10, 2);
    }

    // Low forecourt walls and iron gates are decorative and remain behind the walk plane.
    if (index % 4 !== 1) {
      const wallLeft = x + 2; const wallRight = x + facadeW - 2;
      const gateW = 23; const gateX = Phaser.Math.Clamp(doorX - 3, wallLeft + 9, wallRight - gateW - 7);
      c.fillStyle = '#6e6d61'; c.fillRect(wallLeft, 194, gateX - wallLeft, 11);
      c.fillRect(gateX + gateW, 194, wallRight - gateX - gateW, 11);
      c.fillStyle = '#a69b7b'; c.fillRect(wallLeft, 193, Math.max(1, gateX - wallLeft), 2);
      c.fillRect(gateX + gateW, 193, Math.max(1, wallRight - gateX - gateW), 2);
      c.fillStyle = '#354345'; c.fillRect(gateX, 196, gateW, 9);
      c.fillStyle = '#87907b'; for (let gx = gateX + 2; gx < gateX + gateW; gx += 5) c.fillRect(gx, 196, 1, 9);
      c.fillStyle = '#c5b48a'; c.fillRect(gateX - 2, 193, 3, 12); c.fillRect(gateX + gateW - 1, 193, 3, 12);
    }
    if (style === 2) { c.fillStyle = '#5b7774'; c.fillRect(x + 5, 187, 4, 12); c.fillRect(x + 9, 182, 5, 18); }
    if (index % 7 === 4) {
      const treeX = x + Math.floor(25 + hash(seed + 43) * Math.max(1, facadeW - 50));
      c.fillStyle = '#3e3931'; c.fillRect(treeX, 166, 4, 38); c.fillRect(treeX - 5, 177, 13, 2);
      const foliage = ['#354945', '#40534a', '#59634d', '#776449'];
      for (let leaf = 0; leaf < 18; leaf++) {
        const lx = treeX - 16 + Math.floor(hash(seed + leaf * 5) * 34);
        const ly = 139 + Math.floor(hash(seed + leaf * 7 + 1) * 33);
        c.fillStyle = foliage[leaf % foliage.length]!; c.fillRect(lx, ly, 4 + (leaf % 3), 4 + (leaf % 2));
      }
      c.fillStyle = '#a38354'; c.fillRect(treeX + 1, 169, 2, 1); c.fillRect(treeX - 5, 177, 1, 1);
    }
    x += houseWidth; index++;
  }

  // The foreground walk, continuous kerb, gutters and asphalt all span the route without panel seams.
  c.fillStyle = '#6f7064'; c.fillRect(0, 205, width, 20);
  c.fillStyle = '#8c8975'; c.fillRect(0, 205, width, 2);
  c.fillStyle = '#514f47'; c.fillRect(0, 207, width, 1);
  for (let px = 0; px < width; px += 18) {
    const n = hash(px + 2301);
    c.fillStyle = n > 0.68 ? '#a69d81' : n > 0.35 ? '#807c69' : '#6b6a5f';
    c.fillRect(px, 209, 17, 1); c.fillRect(px + 2, 213, 1, 8);
    if (n > 0.74) { c.fillStyle = '#aaa084'; c.fillRect(px + 6, 217, 8, 1); }
  }
  c.fillStyle = '#302f2c'; c.fillRect(0, 222, width, 2);
  c.fillStyle = '#c0b18b'; c.fillRect(0, 224, width, 4);
  c.fillStyle = '#726d5c'; c.fillRect(0, 228, width, 2);
  const road = c.createLinearGradient(0, 230, 0, 270);
  road.addColorStop(0, '#2f3c3d'); road.addColorStop(1, '#1d292d'); c.fillStyle = road; c.fillRect(0, 230, width, 40);
  for (let rx = 0; rx < width; rx += 29) {
    const n = hash(rx + 8191); const y = 236 + Math.floor(hash(rx + 117) * 29);
    c.fillStyle = n > 0.72 ? 'rgba(207,177,117,.45)' : 'rgba(125,154,145,.38)';
    c.fillRect(rx, y, 7 + Math.floor(n * 17), 1);
    if (n > 0.91) { c.fillStyle = 'rgba(180,187,164,.3)'; c.fillRect(rx + 3, y + 2, 15, 1); }
  }
  for (let rx = 110, i = 0; rx < width; i++, rx += 285 + Math.floor(hash(i + 608) * 90)) {
    const y = 234 + Math.floor(hash(i + 709) * 20);
    c.fillStyle = 'rgba(235,185,105,.46)'; c.fillRect(rx, y, 18 + Math.floor(hash(i + 809) * 32), 1);
    c.fillStyle = 'rgba(162,190,177,.36)'; c.fillRect(rx + 5, y + 3, 12 + Math.floor(hash(i + 909) * 21), 1);
    if (i % 3 === 0) { c.fillStyle = 'rgba(224,187,125,.29)'; c.fillRect(rx + 2, y + 6, 11, 1); }
  }
  for (let rx = 42, i = 0; rx < width; i++, rx += 162 + Math.floor(hash(i + 411) * 120)) {
    const y = 232 + Math.floor(hash(i + 512) * 34);
    c.fillStyle = 'rgba(241,187,103,.42)'; c.fillRect(rx, y, 22 + Math.floor(hash(i + 613) * 46), 2);
    c.fillStyle = 'rgba(172,201,190,.35)'; c.fillRect(rx + 9, y + 3, 13 + Math.floor(hash(i + 714) * 31), 1);
    if (i % 4 === 0) { c.fillStyle = 'rgba(226,194,137,.31)'; c.fillRect(rx + 4, y + 6, 10 + Math.floor(hash(i + 815) * 15), 1); }
  }
  for (let x = 285; x < width; x += 570) {
    c.fillStyle = '#171f21'; c.fillRect(x, 230, 2, 13); c.fillRect(x + 10, 230, 2, 13);
    c.fillStyle = '#4b5753'; c.fillRect(x + 2, 231, 8, 1);
  }
  // Utility wires sit in the atmospheric layer above the building rooflines.
  c.strokeStyle = 'rgba(25,37,42,.58)'; c.lineWidth = 1;
  c.beginPath();
  for (let x = -80; x <= width + 80; x += 380) {
    c.moveTo(x, 52); c.quadraticCurveTo(x + 190, 65 + (x % 7), x + 380, 52);
  }
  c.stroke();
}
