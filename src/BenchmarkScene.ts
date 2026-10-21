import Phaser from 'phaser';
import streetUrl from './assets/benchmark-street.png';
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

const W = 480;
const H = 270;
const FLOOR = 222;
const playerArt = [player0, player1, player2, player3, player4, player5, player6, player7];
const zombieArt = [zombie0, zombie1, zombie2, zombie3, zombie4, zombie5, zombie6, zombie7];
const explosionArt = [explosion0, explosion1, explosion2, explosion3, explosion4, explosion5, explosion6, explosion7];
type ArcadeSprite = Phaser.Physics.Arcade.Sprite;
type PhysicsObject = Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile;

/** An isolated, playable visual benchmark. The original Game scene and its content remain intact. */
export default class BenchmarkScene extends Phaser.Scene {
  player!: ArcadeSprite;
  bullets!: Phaser.Physics.Arcade.Group;
  enemies!: Phaser.Physics.Arcade.Group;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  health = 5;
  grenades = 2;
  score = 0;
  elapsed = 0;
  fireAt = 0;
  grenadeAt = 0;
  hurtAt = -10_000;
  heroStateUntil = 0;
  paused = false;
  outcome: 'playing' | 'clear' | 'down' = 'playing';
  ammoText!: Phaser.GameObjects.Text;
  healthText!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  modal!: Phaser.GameObjects.Container;
  rain: Phaser.GameObjects.Image[] = [];
  rng = 0xB31FA57;
  audioMuted = false;

  constructor() { super('Benchmark'); }

  preload() {
    this.load.image('benchmark-street', streetUrl);
    playerArt.forEach((url, frame) => this.load.image(`bench-player-${frame}`, url));
    zombieArt.forEach((url, frame) => this.load.image(`bench-zombie-${frame}`, url));
    explosionArt.forEach((url, frame) => this.load.image(`bench-explosion-${frame}`, url));
  }

  create() {
    if (!this.anims.exists('bench-explosion')) this.anims.create({ key: 'bench-explosion', frames: explosionArt.map((_, frame) => ({ key: `bench-explosion-${frame}` })), frameRate: 20, repeat: 0 });
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);
    this.add.image(0, 0, 'benchmark-street').setOrigin(0).setDepth(-20);
    this.addPixelAtmosphere();

    const floor = this.physics.add.staticImage(W / 2, FLOOR + 22, 'bullet').setVisible(false);
    floor.setDisplaySize(W, 44).refreshBody();
    this.player = this.physics.add.sprite(89, FLOOR - 32, 'bench-player-0')
      .setDepth(14).setCollideWorldBounds(true).setGravityY(700).setMaxVelocity(185, 520);
    this.player.setSize(19, 54);
    this.bullets = this.physics.add.group({ maxSize: 30 });
    this.enemies = this.physics.add.group({ maxSize: 6 });
    this.physics.add.collider(this.player, floor);
    this.physics.add.collider(this.enemies, floor);
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.touchEnemy, undefined, this);
    this.spawnEnemy(288, 'shambler');
    this.spawnEnemy(432, 'runner');

    this.keys = Object.fromEntries(['A', 'D', 'W', 'SPACE', 'J', 'K', 'P', 'ESC', 'R', 'M']
      .map((key) => [key, this.input.keyboard!.addKey(key)])) as Record<string, Phaser.Input.Keyboard.Key>;
    this.makeHud();
    this.makeRain();
    this.time.addEvent({ delay: 520, loop: true, callback: () => this.steamPuff() });
    this.input.keyboard!.on('keydown-R', () => this.scene.restart());
    this.input.keyboard!.on('keydown-M', () => { this.audioMuted = !this.audioMuted; this.updateHud(); });
  }

  addPixelAtmosphere() {
    const glow = this.add.ellipse(441, 130, 74, 84, 0xf9ab58, 0.13).setBlendMode(Phaser.BlendModes.ADD).setDepth(-4);
    this.tweens.add({ targets: glow, alpha: { from: 0.08, to: 0.2 }, duration: 920, yoyo: true, repeat: -1 });
    const signFlicker = this.add.rectangle(429, 113, 82, 3, 0x8ce1ae, 0.16).setBlendMode(Phaser.BlendModes.ADD).setDepth(-3);
    this.tweens.add({ targets: signFlicker, alpha: { from: 0.05, to: 0.24 }, duration: 1700, yoyo: true, repeat: -1 });
    for (let i = 0; i < 6; i++) {
      const glint = this.add.rectangle(30 + i * 73, 213 + (i % 3) * 7, 18 + (i % 2) * 11, 1, i % 2 ? 0xffb25d : 0x66d3c5, 0.42).setDepth(1);
      this.tweens.add({ targets: glint, alpha: { from: 0.08, to: 0.52 }, scaleX: { from: 0.65, to: 1.25 }, duration: 630 + i * 125, yoyo: true, repeat: -1, delay: i * 105 });
    }
    const g = this.add.graphics().setDepth(-2);
    g.fillStyle(0x07141b, 0.24); g.fillRect(0, 0, W, 30);
    g.fillStyle(0x0b1c22, 0.4); g.fillRect(0, H - 28, W, 28);
  }

  makeRain() {
    const tex = this.textures.createCanvas('bench-rain', 2, 9)!;
    const c = tex.getContext(); c.fillStyle = '#b3e2da'; c.fillRect(0, 0, 1, 8); c.fillStyle = '#f8d898'; c.fillRect(1, 5, 1, 4); tex.refresh();
    for (let i = 0; i < 27; i++) {
      const drop = this.add.image(this.rand() * W, this.rand() * H, 'bench-rain').setAlpha(0.24 + this.rand() * 0.28).setDepth(18);
      drop.setData('speed', 95 + this.rand() * 85); this.rain.push(drop);
    }
  }

  makeHud() {
    const band = this.add.container(0, 0).setScrollFactor(0).setDepth(30);
    band.add(this.add.rectangle(0, 0, W, 31, 0x10191d, 0.93).setOrigin(0));
    band.add(this.add.rectangle(0, 30, W, 1, 0xd99a52, 0.86).setOrigin(0));
    band.add(this.add.text(10, 6, 'B:DC  //  ART BENCH', { fontFamily: 'monospace', fontSize: '8px', color: '#f1bd65', fontStyle: 'bold', letterSpacing: 1 }));
    this.healthText = this.add.text(10, 18, 'FIELD HEALTH  ■ ■ ■ ■ ■', { fontFamily: 'monospace', fontSize: '6px', color: '#e37c5b' }); band.add(this.healthText);
    this.statusText = this.add.text(240, 7, 'RESIDENTIAL BELFAST  /  03:17', { fontFamily: 'monospace', fontSize: '7px', color: '#d7ddc3' }).setOrigin(0.5, 0); band.add(this.statusText);
    this.ammoText = this.add.text(467, 18, 'GRENADE  ■ ■', { fontFamily: 'monospace', fontSize: '6px', color: '#dbc98a' }).setOrigin(1, 0); band.add(this.ammoText);
    this.add.text(W / 2, H - 16, 'A / D MOVE     SPACE JUMP     J FIRE     K GRENADE     P PAUSE     M MUTE', { fontFamily: 'monospace', fontSize: '6px', color: '#eff0cf', stroke: '#112023', strokeThickness: 2, letterSpacing: 0.4 }).setOrigin(0.5).setDepth(29);
    this.modal = this.add.container(W / 2, H / 2).setDepth(40).setVisible(false);
    this.updateHud();
  }

  spawnEnemy(x: number, kind: 'shambler' | 'runner') {
    const frame = kind === 'shambler' ? 0 : 4;
    const e = this.physics.add.sprite(x, FLOOR - 32, `bench-zombie-${frame}`).setDepth(13).setCollideWorldBounds(true).setGravityY(700);
    e.setSize(kind === 'shambler' ? 25 : 26, 52).setData({ kind, hp: kind === 'shambler' ? 4 : 2, state: 'stalk', nextAttack: 850 + x * 2, hitUntil: 0, frame, dead: false });
    (e.body as Phaser.Physics.Arcade.Body).setMaxVelocity(250, 520);
    this.enemies.add(e);
  }

  update(_time: number, delta: number) {
    const d = Math.min(delta, 40);
    if (this.outcome !== 'playing') return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.togglePause();
    if (this.paused) return;
    this.elapsed += d;
    const now = this.elapsed;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const move = (this.keys.A.isDown ? -1 : 0) + (this.keys.D.isDown ? 1 : 0);
    if (move) { body.setVelocityX(move * 145); this.player.setFlipX(move < 0); }
    else body.setVelocityX(body.velocity.x * 0.76);
    if ((Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.W)) && body.blocked.down) {
      body.setVelocityY(-315); this.heroStateUntil = now + 170; this.sfx(390, 'triangle', 0.035);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.J)) this.fire();
    if (Phaser.Input.Keyboard.JustDown(this.keys.K)) this.throwGrenade();

    this.animatePlayer(now, body);
    this.updateEnemies(now);
    for (const drop of this.rain) {
      drop.y += (drop.getData('speed') as number) * d / 1000; drop.x -= 12 * d / 1000;
      if (drop.y > H + 8) { drop.y = -this.rand() * 20; drop.x = this.rand() * W; }
      if (drop.x < -4) drop.x = W + this.rand() * 12;
    }
    this.updateHud();
  }

  animatePlayer(now: number, body: Phaser.Physics.Arcade.Body) {
    let frame = 0;
    if (now < this.hurtAt + 240) frame = 5;
    else if (Math.abs(body.velocity.y) > 35) frame = body.velocity.y < 0 ? 3 : 7;
    else if (now < this.heroStateUntil) frame = 6;
    else if (now < this.fireAt + 105) frame = 4;
    else if (Math.abs(body.velocity.x) > 28) frame = Math.floor(now / 105) % 2 ? 1 : 2;
    this.player.setTexture(`bench-player-${frame}`);
    if (this.health > 0 && now - this.hurtAt < 850) this.player.setAlpha(Math.floor(now / 75) % 2 ? 0.35 : 1);
    else this.player.setAlpha(1);
  }

  fire() {
    if (this.elapsed - this.fireAt < 155) return;
    this.fireAt = this.elapsed;
    const dir = this.player.flipX ? -1 : 1;
    const x = this.player.x + dir * 25;
    const bullet = this.physics.add.image(x, this.player.y - 8, 'bullet').setDepth(16).setFlipX(dir < 0);
    bullet.setVelocity(dir * 470, 0); (bullet.body as Phaser.Physics.Arcade.Body).allowGravity = false; bullet.setData('life', 0);
    bullet.body?.setSize(9, 5); this.bullets.add(bullet);
    this.time.delayedCall(900, () => { if (bullet.active) bullet.destroy(); });
    const flash = this.add.image(x + dir * 4, this.player.y - 8, 'fire-0').setDepth(17).setScale(0.84).setFlipX(dir < 0);
    this.tweens.add({ targets: flash, alpha: 0, scale: 1.4, duration: 90, onComplete: () => flash.destroy() });
    this.sfx(500, 'square', 0.04);
  }

  throwGrenade() {
    if (!this.grenades || this.elapsed - this.grenadeAt < 520) return;
    this.grenadeAt = this.elapsed; this.grenades--;
    const dir = this.player.flipX ? -1 : 1;
    const bomb = this.physics.add.image(this.player.x + dir * 19, this.player.y - 8, 'grenade').setDepth(17);
    bomb.setGravityY(440).setBounce(0.35).setVelocity(dir * 155, -250);
    this.physics.add.collider(bomb, this.enemies);
    this.time.delayedCall(690, () => { if (bomb.active) { const x = bomb.x, y = bomb.y; bomb.destroy(); this.explode(x, y); } });
    this.heroStateUntil = this.elapsed + 210; this.sfx(145, 'triangle', 0.055); this.updateHud();
  }

  hitEnemy(projectile: PhysicsObject, target: PhysicsObject) {
    const bullet = projectile as ArcadeSprite; const enemy = target as ArcadeSprite;
    if (!bullet.active || !enemy.active) return;
    bullet.destroy(); enemy.setData('hp', (enemy.getData('hp') as number) - 1); enemy.setData('hitUntil', this.elapsed + 175);
    this.hitSpark(enemy.x, enemy.y - 12, enemy.getData('kind') === 'runner' ? 0xff744f : 0x86d2b0);
    this.cameras.main.shake(55, 0.0018); this.sfx(125, 'sawtooth', 0.026);
    if ((enemy.getData('hp') as number) <= 0) this.killEnemy(enemy);
  }

  updateEnemies(now: number) {
    for (const enemy of this.enemies.getChildren() as ArcadeSprite[]) {
      if (!enemy.active) continue;
      const kind = enemy.getData('kind') as 'shambler' | 'runner';
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const dir = Math.sign(this.player.x - enemy.x) || -1;
      const dist = Math.abs(this.player.x - enemy.x);
      if (now < (enemy.getData('hitUntil') as number)) {
        body.setVelocityX(0); enemy.setTexture(`bench-zombie-${kind === 'shambler' ? 3 : 7}`).setTintFill(0xffe0b5); continue;
      }
      enemy.clearTint();
      let state = enemy.getData('state') as string;
      if (kind === 'shambler') {
        if (state === 'windup') {
          body.setVelocityX(0); enemy.setTexture('bench-zombie-2');
          if (now >= (enemy.getData('attackAt') as number)) {
            enemy.setData('state', 'stalk'); enemy.setData('nextAttack', now + 1150); enemy.setTexture('bench-zombie-1');
            if (dist < 57) this.damagePlayer();
          }
        } else {
          body.setVelocityX(dir * (dist < 52 ? 0 : 31));
          enemy.setFlipX(dir < 0).setTexture(Math.floor(now / 260) % 2 ? 'bench-zombie-0' : 'bench-zombie-1');
          if (dist < 63 && now >= (enemy.getData('nextAttack') as number)) { enemy.setData('state', 'windup'); enemy.setData('attackAt', now + 520); }
        }
      } else if (state === 'windup') {
        body.setVelocityX(dir * 6); enemy.setFlipX(dir < 0).setTexture('bench-zombie-4');
        if (now >= (enemy.getData('attackAt') as number)) {
          enemy.setData('state', 'lunge'); enemy.setData('attackAt', now + 360); body.setVelocityX(dir * 228); body.setVelocityY(-68); enemy.setTexture('bench-zombie-7');
        }
      } else if (state === 'lunge') {
        enemy.setFlipX(dir < 0).setTexture(Math.floor(now / 95) % 2 ? 'bench-zombie-5' : 'bench-zombie-6');
        if (dist < 39 && now >= (enemy.getData('nextAttack') as number)) { enemy.setData('nextAttack', now + 760); this.damagePlayer(); }
        if (now >= (enemy.getData('attackAt') as number)) enemy.setData('state', 'stalk');
      } else {
        body.setVelocityX(dir * (dist < 55 ? 0 : 66));
        enemy.setFlipX(dir < 0).setTexture(Math.floor(now / 90) % 2 ? 'bench-zombie-5' : 'bench-zombie-6');
        if (dist < 168 && now >= (enemy.getData('nextAttack') as number)) { enemy.setData('state', 'windup'); enemy.setData('attackAt', now + 410); }
      }
    }
  }

  touchEnemy(_player: PhysicsObject, target: PhysicsObject) {
    const enemy = target as ArcadeSprite;
    if (enemy.active && enemy.getData('state') === 'lunge' && this.elapsed >= (enemy.getData('nextAttack') as number)) {
      enemy.setData('nextAttack', this.elapsed + 760); this.damagePlayer();
    }
  }

  damagePlayer() {
    if (this.elapsed - this.hurtAt < 880 || this.outcome !== 'playing') return;
    this.hurtAt = this.elapsed; this.health = Math.max(0, this.health - 1);
    this.cameras.main.shake(145, 0.008);
    this.hitSpark(this.player.x, this.player.y - 12, 0xef7358); this.sfx(78, 'sawtooth', 0.06);
    if (!this.health) this.finish('down'); this.updateHud();
  }

  killEnemy(enemy: ArcadeSprite) {
    if (!enemy.active) return;
    const runner = enemy.getData('kind') === 'runner';
    const x = enemy.x, y = enemy.y;
    enemy.disableBody(true, true); this.score += runner ? 200 : 100;
    const colors = runner ? [0xff694e, 0xf29f4c, 0x8d423d] : [0x90c284, 0xb57e54, 0x59675b];
    for (let i = 0; i < 15; i++) {
      const shard = this.add.rectangle(x, y - 5, 2 + (i % 3), 2 + (i % 2), colors[i % colors.length]).setDepth(18);
      this.tweens.add({ targets: shard, x: x + (this.rand() - 0.5) * 80, y: y - 18 - this.rand() * 46, alpha: 0, angle: this.rand() * 260, duration: 410 + this.rand() * 330, ease: 'Quad.easeOut', onComplete: () => shard.destroy() });
    }
    this.sfx(runner ? 92 : 105, 'triangle', 0.065);
    if (!this.enemies.countActive()) this.finish('clear');
  }

  hitSpark(x: number, y: number, color: number) {
    for (let i = 0; i < 5; i++) {
      const spark = this.add.image(x, y, `fire-${i}`).setDepth(18).setTint(color).setScale(0.46 + i * 0.09);
      this.tweens.add({ targets: spark, x: x + (this.rand() - 0.5) * 24, y: y - 3 - this.rand() * 15, alpha: 0, duration: 120 + i * 18, onComplete: () => spark.destroy() });
    }
  }

  explode(x: number, y: number) {
    this.cameras.main.shake(260, 0.011);
    const blast = this.add.sprite(x, y, 'bench-explosion-0').setDepth(21).setScale(1.55).setBlendMode(Phaser.BlendModes.ADD);
    blast.play('bench-explosion'); blast.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => blast.destroy());
    for (let i = 0; i < 28; i++) {
      const a = this.rand() * Math.PI * 2; const radius = 26 + this.rand() * 78;
      const shard = this.add.rectangle(x, y, i % 5 === 0 ? 4 : 2, i % 4 === 0 ? 4 : 2, [0xffe89a, 0xff9c39, 0xf05636, 0x91c49a][i % 4]).setDepth(22);
      this.tweens.add({ targets: shard, x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius - this.rand() * 25, alpha: 0, angle: this.rand() * 180, duration: 260 + this.rand() * 270, ease: 'Cubic.easeOut', onComplete: () => shard.destroy() });
    }
    for (const enemy of this.enemies.getChildren() as ArcadeSprite[]) if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < 118) this.killEnemy(enemy);
    this.sfx(58, 'sawtooth', 0.075);
  }

  steamPuff() {
    if (this.paused || this.outcome !== 'playing') return;
    const x = 230 + this.rand() * 18;
    const puff = this.add.image(x, FLOOR - 3, `smoke-${Math.floor(this.rand() * 4)}`).setDepth(10).setAlpha(0.34).setTint(0x789b94).setScale(0.55);
    this.tweens.add({ targets: puff, y: puff.y - 25 - this.rand() * 11, x: x + 7, scale: 1.2, alpha: 0, duration: 950, onComplete: () => puff.destroy() });
  }

  togglePause() {
    this.paused = !this.paused; this.physics.world.isPaused = this.paused;
    if (this.paused) this.showModal('PAUSED', 'P / ESC RESUME     R RESTART');
    else this.modal.setVisible(false);
  }

  finish(outcome: 'clear' | 'down') {
    this.outcome = outcome;
    if (outcome === 'clear') {
      this.cameras.main.shake(320, 0.009);
      for (let i = 0; i < 9; i++) this.time.delayedCall(i * 90, () => this.explode(195 + i * 13, FLOOR - 35 - (i % 2) * 12));
      this.time.delayedCall(790, () => this.showModal('STREET CLEAR', 'ART BENCH COMPLETE     R REPLAY'));
    } else this.showModal('DOWN ON THE SHANKILL', 'R REPLAY     P PAUSE');
    this.updateHud();
  }

  showModal(title: string, sub: string) {
    this.modal.removeAll(true).setVisible(true);
    this.modal.add(this.add.rectangle(0, 0, 278, 78, 0x11191d, 0.96).setStrokeStyle(2, 0xd99a52));
    this.modal.add(this.add.text(0, -15, title, { fontFamily: 'monospace', fontSize: '16px', color: '#f4c16a', fontStyle: 'bold', letterSpacing: 1 }).setOrigin(0.5));
    this.modal.add(this.add.text(0, 15, sub, { fontFamily: 'monospace', fontSize: '7px', color: '#e0ddc6', letterSpacing: 0.4 }).setOrigin(0.5));
  }

  updateHud() {
    if (!this.healthText) return;
    this.healthText.setText(`FIELD HEALTH  ${'■ '.repeat(this.health).trim()}${this.health < 5 ? `  ${'· '.repeat(5 - this.health)}` : ''}`);
    this.ammoText.setText(`GRENADE  ${'■ '.repeat(this.grenades).trim() || '—'}   ${this.audioMuted ? 'MUTED' : 'M AUDIO'}`);
    if (this.outcome === 'playing') this.statusText.setText(`RESIDENTIAL BELFAST  /  ${String(Math.floor(this.elapsed / 1000)).padStart(2, '0')} SEC   ${String(this.score).padStart(4, '0')} PTS`);
  }

  sfx(freq: number, wave: OscillatorType, volume: number) {
    if (this.audioMuted) return;
    try {
      const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = wave; osc.frequency.value = freq; gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.11);
      osc.onended = () => { void ctx.close(); };
    } catch { /* Audio may be unavailable or not unlocked in the browser. */ }
  }

  rand() { this.rng = (this.rng * 1664525 + 1013904223) >>> 0; return this.rng / 4294967296; }
}
