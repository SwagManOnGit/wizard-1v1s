// three.js arena: two low-poly wizards, projectiles, particles, lane telegraphs.
// Everything is built from primitives so the bundle stays tiny and no models are needed.
import * as THREE from 'three';
import { ENEMY_Z, LANE_X, type EnemyTier } from './data';
import type { Battle, BattleEvent, Projectile } from './battle';

const PLAYER_LOOK = { robe: '#3b3f8f', hat: '#2b2f6e', trim: '#ffd166' };

// ---- helpers ------------------------------------------------------------------
function glowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function floorTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7a7a7a';
  g.fillRect(0, 0, 256, 512);
  // Stone noise.
  for (let i = 0; i < 2600; i++) {
    const v = 100 + Math.floor(Math.random() * 60);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(Math.random() * 256, Math.random() * 512, 3 + Math.random() * 6, 3 + Math.random() * 6);
  }
  // Lane lines.
  g.strokeStyle = 'rgba(255,255,255,0.18)';
  g.lineWidth = 2;
  for (const x of [64, 128, 192]) {
    g.beginPath(); g.moveTo(x - 32, 0); g.lineTo(x - 32, 512); g.stroke();
  }
  g.beginPath(); g.moveTo(224, 0); g.lineTo(224, 512); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const GLOW = glowTexture();

function col(hex: string): THREE.Color { return new THREE.Color(hex); }

// ---- particles ------------------------------------------------------------------
class Particles {
  readonly points: THREE.Points;
  private readonly max = 700;
  private pos: Float32Array;
  private colors: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private base: Float32Array;
  private grav: Float32Array;
  private cursor = 0;

  constructor() {
    const n = this.max;
    this.pos = new Float32Array(n * 3);
    this.colors = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.maxLife = new Float32Array(n);
    this.base = new Float32Array(n * 3);
    this.grav = new Float32Array(n);
    for (let i = 0; i < n; i++) this.pos[i * 3 + 1] = -100;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.28, map: GLOW, vertexColors: true, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }

  emit(p: THREE.Vector3, color: THREE.Color, count: number, speed: number, life: number, gravity = 0, spread = 0.1): void {
    for (let k = 0; k < count; k++) {
      const i = this.cursor; this.cursor = (this.cursor + 1) % this.max;
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.pos[i * 3] = p.x + (Math.random() - 0.5) * spread;
      this.pos[i * 3 + 1] = p.y + (Math.random() - 0.5) * spread;
      this.pos[i * 3 + 2] = p.z + (Math.random() - 0.5) * spread;
      this.vel[i * 3] = dir.x * sp; this.vel[i * 3 + 1] = dir.y * sp; this.vel[i * 3 + 2] = dir.z * sp;
      this.life[i] = this.maxLife[i] = life * (0.6 + Math.random() * 0.6);
      this.base[i * 3] = color.r; this.base[i * 3 + 1] = color.g; this.base[i * 3 + 2] = color.b;
      this.grav[i] = gravity;
    }
  }

  update(dt: number): void {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -100; this.colors[i * 3] = this.colors[i * 3 + 1] = this.colors[i * 3 + 2] = 0; continue; }
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      this.colors[i * 3] = this.base[i * 3] * f; this.colors[i * 3 + 1] = this.base[i * 3 + 1] * f; this.colors[i * 3 + 2] = this.base[i * 3 + 2] * f;
    }
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }
}

// ---- wizard -----------------------------------------------------------------------
interface WizardLook { robe: string; hat: string; trim: string }

class Wizard {
  readonly group = new THREE.Group();
  private body = new THREE.Group();
  private staffPivot = new THREE.Group();
  private robeMat: THREE.MeshStandardMaterial;
  private hatMat: THREE.MeshStandardMaterial;
  private trimMat: THREE.MeshStandardMaterial;
  private skinMat: THREE.MeshStandardMaterial;
  private orbMat: THREE.MeshBasicMaterial;
  private orbGlow: THREE.Sprite;
  private shield: THREE.Mesh;
  private shieldWire: THREE.Mesh;
  private shieldMat: THREE.MeshBasicMaterial;
  private shieldWireMat: THREE.MeshBasicMaterial;
  private allMats: THREE.Material[];
  readonly orb = new THREE.Object3D();
  bob = Math.random() * 6;
  castT = 0;      // >0 while the staff is raised
  hold = false;   // keep the staff raised (telegraph)
  hitT = 0;
  tilt = 0;
  deathT = -1;
  frozen = false;
  phased = false;
  x = 0;
  scale = 1;

  constructor(look: WizardLook, facing: 1 | -1, scale = 1) {
    this.scale = scale;
    const flat = { flatShading: true, roughness: 0.85, metalness: 0.05 };
    this.robeMat = new THREE.MeshStandardMaterial({ color: col(look.robe), ...flat });
    this.hatMat = new THREE.MeshStandardMaterial({ color: col(look.hat), ...flat });
    this.trimMat = new THREE.MeshStandardMaterial({ color: col(look.trim), ...flat });
    this.skinMat = new THREE.MeshStandardMaterial({ color: col('#e8c39e'), ...flat });
    const dark = new THREE.MeshStandardMaterial({ color: col('#26190f'), ...flat });
    const wood = new THREE.MeshStandardMaterial({ color: col('#6b4a2b'), ...flat });
    this.orbMat = new THREE.MeshBasicMaterial({ color: col(look.trim) });
    this.allMats = [this.robeMat, this.hatMat, this.trimMat, this.skinMat, dark, wood, this.orbMat];
    for (const m of this.allMats) m.transparent = true;

    const b = this.body;
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.75, 7), this.robeMat); robe.position.y = 0.87; b.add(robe);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.12, 8), this.trimMat); belt.position.y = 1.15; b.add(belt);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), this.skinMat); head.position.y = 1.92; b.add(head);
    for (const sx of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), dark); eye.position.set(sx, 1.96, 0.24); b.add(eye);
    }
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.45, 6), this.trimMat);
    beard.rotation.x = Math.PI; beard.position.set(0, 1.62, 0.16); b.add(beard);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.06, 12), this.hatMat); brim.position.y = 2.12; b.add(brim);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 7), this.hatMat); hat.position.y = 2.6; hat.rotation.z = 0.12; b.add(hat);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.1, 8), this.trimMat); band.position.y = 2.2; b.add(band);

    // Staff arm pivots at the shoulder so it can be raised to cast.
    const sp = this.staffPivot; sp.position.set(0.42, 1.5, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.55, 6), this.robeMat);
    arm.position.set(0.12, -0.25, 0); arm.rotation.z = -0.5; sp.add(arm);
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 6), wood);
    staff.position.set(0.28, -0.35, 0); sp.add(staff);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), this.orbMat);
    orb.position.set(0.28, 0.75, 0); sp.add(orb);
    this.orb.position.copy(orb.position); sp.add(this.orb);
    this.orbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: col(look.trim), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
    this.orbGlow.scale.set(0.9, 0.9, 1); this.orbGlow.position.copy(orb.position); sp.add(this.orbGlow);
    b.add(sp);

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.65, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.015; this.group.add(shadow);

    this.shieldMat = new THREE.MeshBasicMaterial({ color: col('#6ea8ff'), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    this.shieldWireMat = new THREE.MeshBasicMaterial({ color: col('#bfe0ff'), transparent: true, opacity: 0, wireframe: true, depthWrite: false });
    this.shield = new THREE.Mesh(new THREE.SphereGeometry(1.25, 14, 10), this.shieldMat); this.shield.position.y = 1.4;
    this.shieldWire = new THREE.Mesh(new THREE.SphereGeometry(1.27, 10, 8), this.shieldWireMat); this.shieldWire.position.y = 1.4;
    this.group.add(this.shield, this.shieldWire);

    b.rotation.y = facing === 1 ? 0 : Math.PI;
    b.scale.setScalar(scale);
    this.group.add(b);
  }

  setLook(look: WizardLook): void {
    this.robeMat.color.set(look.robe); this.hatMat.color.set(look.hat); this.trimMat.color.set(look.trim);
    this.orbMat.color.set(look.trim); (this.orbGlow.material as THREE.SpriteMaterial).color.set(look.trim);
  }

  reset(): void { this.deathT = -1; this.hitT = 0; this.castT = 0; this.hold = false; this.frozen = false; this.phased = false; this.tilt = 0; this.body.rotation.x = 0; this.group.position.y = 0; }

  orbWorld(target: THREE.Vector3): THREE.Vector3 { return this.orb.getWorldPosition(target); }

  setShield(amount: number, reflect: boolean): void {
    const on = amount > 0 || reflect;
    const target = on ? (reflect ? 0.45 : 0.22) : 0;
    this.shieldMat.opacity += (target - this.shieldMat.opacity) * 0.25;
    this.shieldWireMat.opacity += ((on ? 0.25 : 0) - this.shieldWireMat.opacity) * 0.25;
    this.shieldMat.color.set(reflect ? '#f2f7ff' : '#6ea8ff');
  }

  update(dt: number, time: number): void {
    this.bob += dt;
    this.group.position.x += (this.x - this.group.position.x) * Math.min(1, dt * 14);
    this.tilt *= Math.max(0, 1 - dt * 6);
    this.body.rotation.z = this.tilt;
    const bobY = this.frozen ? 0 : Math.sin(this.bob * 2.2) * 0.04;
    this.body.position.y = bobY;

    // Staff raise.
    if (this.castT > 0) this.castT = Math.max(0, this.castT - dt * 2.4);
    const raise = this.hold ? 1 : Math.sin(Math.min(1, this.castT) * Math.PI);
    this.staffPivot.rotation.x += (-1.15 * raise - this.staffPivot.rotation.x) * Math.min(1, dt * 16);
    const glow = 0.8 + raise * 0.9 + (this.hold ? Math.sin(time * 14) * 0.25 : 0);
    this.orbGlow.scale.set(glow, glow, 1);

    // Hit flash and freeze tint.
    this.hitT = Math.max(0, this.hitT - dt * 3);
    const em = this.robeMat.emissive;
    if (this.frozen) em.set('#3a8fd0'); else em.setRGB(this.hitT, this.hitT * 0.6, this.hitT * 0.6);
    this.hatMat.emissive.copy(em).multiplyScalar(0.6);
    this.skinMat.emissive.copy(em).multiplyScalar(0.4);
    const op = this.phased ? 0.35 : 1;
    for (const m of this.allMats) m.opacity += (op - m.opacity) * Math.min(1, dt * 10);

    // Death: topple over and sink.
    if (this.deathT >= 0) {
      this.deathT += dt;
      const k = Math.min(1, this.deathT / 1.1);
      this.body.rotation.x = -k * k * 1.5;
      this.group.position.y = -k * 0.6;
    }
    this.shield.scale.setScalar(1 + Math.sin(time * 5) * 0.03);
    this.shieldWire.rotation.y = time * 0.6;
  }
}

// ---- arena ---------------------------------------------------------------------------
interface ProjView { group: THREE.Group; p: Projectile; ring?: THREE.Mesh; last: THREE.Vector3 }

export class Arena {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly player: Wizard;
  readonly enemy: Wizard;
  private particles = new Particles();
  private projViews = new Map<number, ProjView>();
  private laneMarkers: THREE.Mesh[] = [];
  private laneT: number[] = [0, 0, 0];
  private laneMat: THREE.MeshBasicMaterial[] = [];
  private floorMat: THREE.MeshStandardMaterial;
  private portal: THREE.Mesh;
  private portalMat: THREE.MeshBasicMaterial;
  private torches: THREE.Sprite[] = [];
  private hemi: THREE.HemisphereLight;
  private shake = 0;
  private time = 0;
  private tmp = new THREE.Vector3();
  private running = true;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.className = 'arena-canvas';
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
    this.camera.position.set(0, 6.2, 9.4);
    this.camera.lookAt(0, 0.8, -6.5);

    this.hemi = new THREE.HemisphereLight(0xbfd4ff, 0x30281f, 1.1);
    this.scene.add(this.hemi);
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.5); sun.position.set(3, 9, 5); this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x8ab4ff, 0.6); rim.position.set(-4, 5, -8); this.scene.add(rim);

    this.floorMat = new THREE.MeshStandardMaterial({ map: floorTexture(), color: col('#2c3358'), roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 70), this.floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.z = -12; this.scene.add(floor);

    // Rune rings under each wizard.
    for (const z of [0, ENEMY_Z]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.02, z); this.scene.add(ring);
    }

    // Lane telegraph strips.
    for (let i = 0; i < 3; i++) {
      const m = new THREE.MeshBasicMaterial({ color: col('#ff4040'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.35, -ENEMY_Z + 1), m);
      strip.rotation.x = -Math.PI / 2; strip.position.set(LANE_X[i], 0.03, ENEMY_Z / 2 + 0.5);
      this.scene.add(strip); this.laneMarkers.push(strip); this.laneMat.push(m);
    }

    // Pillars with torches.
    const pillarMat = new THREE.MeshStandardMaterial({ color: col('#4a4a5e'), flatShading: true, roughness: 1 });
    for (const x of [-4.6, 4.6]) {
      for (const z of [3, -3, -9, -15, -21]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 5.5, 7), pillarMat);
        p.position.set(x, 2.75, z); this.scene.add(p);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), pillarMat); cap.position.set(x, 5.6, z); this.scene.add(cap);
        const torch = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: col('#ffb060'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        torch.position.set(x, 6.1, z); torch.scale.set(1.6, 1.6, 1); this.scene.add(torch); this.torches.push(torch);
      }
    }
    // Magic portal behind the enemy.
    this.portalMat = new THREE.MeshBasicMaterial({ color: col('#8ab4ff'), transparent: true, opacity: 0.7 });
    this.portal = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.22, 8, 40), this.portalMat);
    this.portal.position.set(0, 3.6, ENEMY_Z - 9); this.scene.add(this.portal);
    const portalInner = new THREE.Mesh(new THREE.CircleGeometry(3.0, 40), new THREE.MeshBasicMaterial({ color: col('#0a0a1a'), transparent: true, opacity: 0.85 }));
    portalInner.position.copy(this.portal.position); this.scene.add(portalInner);

    this.player = new Wizard(PLAYER_LOOK, -1, 1);
    this.player.group.position.set(0, 0, 0);
    this.enemy = new Wizard({ robe: '#5b6b8c', hat: '#46527a', trim: '#c9d3ff' }, 1, 1);
    this.enemy.group.position.set(0, 0, ENEMY_Z);
    this.scene.add(this.player.group, this.enemy.group, this.particles.points);

    this.setTheme({ sky: '#1b2140', fog: '#1b2140', floor: '#2c3358', spell: '#8ab4ff' });
    this.resize();
  }

  setTheme(t: { sky: string; fog: string; floor: string; spell: string }): void {
    this.scene.background = col(t.sky);
    this.scene.fog = new THREE.Fog(col(t.fog), 14, 42);
    this.floorMat.color.set(t.floor);
    this.portalMat.color.set(t.spell);
    this.hemi.color.set(t.spell).lerp(new THREE.Color(0xffffff), 0.5);
  }

  setEnemyLook(tier: EnemyTier, boss: boolean): void {
    this.enemy.setLook(tier);
    this.enemy.group.scale.setScalar(boss ? 1.35 : 1);
    this.enemy.reset();
    this.player.reset();
    this.setTheme(tier);
    for (const v of this.projViews.values()) this.scene.remove(v.group);
    this.projViews.clear();
    this.laneT = [0, 0, 0];
  }

  resize(): void {
    const w = Math.max(1, this.container.clientWidth), h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    // Keep a sensible horizontal field of view on tall phones without going fisheye.
    const vfov = (2 * Math.atan(Math.tan((21 * Math.PI) / 360) / aspect) * 180) / Math.PI;
    this.camera.fov = Math.min(94, Math.max(44, vfov));
    this.camera.aspect = aspect;
    // Tall screens pull the camera back a touch so both wizards fit.
    const back = aspect < 0.7 ? (0.7 - aspect) * 4 : 0;
    this.camera.position.set(0, 6.2 + back * 0.4, 9.4 + back);
    this.camera.lookAt(0, 0.8, -6.5);
    this.camera.updateProjectionMatrix();
  }

  /** Projects a world point to CSS pixels inside the container. */
  project(v: THREE.Vector3): { x: number; y: number } {
    const p = this.tmp.copy(v).project(this.camera);
    return { x: ((p.x + 1) / 2) * this.container.clientWidth, y: ((1 - p.y) / 2) * this.container.clientHeight };
  }

  playerAnchor(): THREE.Vector3 { return new THREE.Vector3(this.player.group.position.x, 2.4, 0); }
  enemyAnchor(): THREE.Vector3 { return new THREE.Vector3(this.enemy.group.position.x, 3.0 * this.enemy.group.scale.x, ENEMY_Z); }

  private spawnProjectile(p: Projectile): void {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 10, 8), new THREE.MeshBasicMaterial({ color: col(p.color) }));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: col(p.color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(p.radius * 7, p.radius * 7, 1);
    g.add(core, glow);
    let ring: THREE.Mesh | undefined;
    if (p.homing && p.owner === 'enemy') {
      ring = new THREE.Mesh(new THREE.TorusGeometry(p.radius * 1.9, 0.05, 6, 18), new THREE.MeshBasicMaterial({ color: col('#ffffff'), transparent: true, opacity: 0.8 }));
      g.add(ring);
    }
    const start = (p.owner === 'player' ? this.player : this.enemy).orbWorld(new THREE.Vector3());
    g.position.copy(start);
    this.scene.add(g);
    this.projViews.set(p.id, { group: g, p, ring, last: start.clone() });
  }

  private removeProjectile(id: number, burst: boolean, big: boolean): void {
    const v = this.projViews.get(id);
    if (!v) return;
    this.scene.remove(v.group);
    v.group.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = (m as THREE.Mesh).material as THREE.Material | undefined;
      if (mat && !(mat instanceof THREE.SpriteMaterial && mat.map === GLOW)) mat.dispose?.();
    });
    this.projViews.delete(id);
    if (burst) this.particles.emit(v.last, col(v.p.color), big ? 40 : 12, big ? 5 : 2.5, big ? 0.7 : 0.4, big ? 4 : 1, 0.2);
  }

  handleEvents(events: BattleEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'spawn': this.spawnProjectile(e.p); break;
        case 'impact': this.removeProjectile(e.p.id, true, e.hit); if (e.hit) { (e.who === 'player' ? this.player : this.enemy).hitT = 1; if (e.who === 'player') this.shake = 0.5; } break;
        case 'reflect': { const v = this.projViews.get(e.p.id); if (v) { this.particles.emit(v.last, col('#ffffff'), 25, 4, 0.5); (v.group.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.color.set('#e6f2ff'); ((v.group.children[1] as THREE.Sprite).material as THREE.SpriteMaterial).color.set('#e6f2ff'); } break; }
        case 'cast':
          if (e.who === 'player') { this.player.castT = 1; this.particles.emit(this.player.orbWorld(new THREE.Vector3()), col(e.color), 14, 2, 0.4); }
          else { this.enemy.hold = false; this.enemy.castT = 1; }
          break;
        case 'telegraph':
          this.enemy.hold = true;
          if (e.kind !== 'heal' && e.kind !== 'shield') for (const l of e.lanes) this.laneT[l] = e.dur + 0.4;
          for (let i = 0; i < 3; i++) this.laneMat[i].color.set(e.kind === 'homing' ? '#ff4df2' : '#ff4040');
          if (e.kind === 'heal') this.particles.emit(this.enemyAnchor().setY(1), col('#7dff9b'), 30, 2, 1.2, -2, 1);
          break;
        case 'interrupt': this.enemy.hold = false; this.enemy.castT = 0; this.particles.emit(this.enemyAnchor().setY(1.5), col('#ffffff'), 20, 3, 0.5); break;
        case 'heal': this.particles.emit((e.who === 'player' ? this.playerAnchor() : this.enemyAnchor()).setY(0.8), col('#7dff9b'), 30, 1.5, 1.1, -2.5, 1.2); break;
        case 'shield': this.particles.emit((e.who === 'player' ? this.playerAnchor() : this.enemyAnchor()).setY(1.4), col('#6ea8ff'), 30, 3, 0.7, 0, 1.5); break;
        case 'phase': this.particles.emit(this.playerAnchor().setY(1.4), col('#c4c4ff'), 18, 2, 0.5, 0, 1.2); break;
        case 'freeze': this.enemy.hold = false; this.enemy.castT = 0; this.particles.emit(this.enemyAnchor().setY(1.4), col('#b8f4ff'), 40, 3, 0.9, 2, 1.4); break;
        case 'revive': this.particles.emit(this.playerAnchor().setY(1), col('#ffd166'), 80, 5, 1.3, -1, 1); break;
        case 'death': {
          const w = e.who === 'player' ? this.player : this.enemy;
          w.deathT = 0; w.hold = false;
          this.particles.emit((e.who === 'player' ? this.playerAnchor() : this.enemyAnchor()).setY(1.2), col(e.who === 'player' ? '#ff6060' : '#ffffff'), 90, 5, 1.4, 3, 1.4);
          if (e.who === 'player') this.shake = 1;
          break;
        }
        default: break;
      }
    }
  }

  update(dt: number, battle: Battle | null): void {
    this.time += dt;
    if (battle) {
      const p = battle.player, en = battle.enemy;
      this.player.x = LANE_X[p.lane];
      if (p.dodgeT < 0.05 && p.dodgeDir) this.player.tilt = -p.dodgeDir * 0.35;
      this.player.phased = p.phaseCharges > 0;
      this.player.setShield(p.shield, p.reflectT > 0);
      this.enemy.x = en.x;
      this.enemy.frozen = en.freezeT > 0;
      this.enemy.setShield(en.shield, false);
      if (en.freezeT > 0 || battle.over) this.enemy.hold = false;

      // Sync projectiles.
      for (const pr of battle.projectiles) {
        if (pr.delayZ > 0) continue;
        let v = this.projViews.get(pr.id);
        if (!v) { this.spawnProjectile(pr); v = this.projViews.get(pr.id)!; }
        const prog = pr.owner === 'enemy' ? (pr.z - ENEMY_Z) / -ENEMY_Z : pr.z / ENEMY_Z;
        const k = Math.max(0, Math.min(1, prog));
        const x = pr.x0 + (pr.x1 - pr.x0) * k;
        const lob = pr.speed < 12 ? 2.2 : 0.5;
        const y = 1.5 + Math.sin(k * Math.PI) * lob + (pr.owner === 'enemy' ? 0 : 0.3);
        v.group.position.set(x, y, pr.z);
        v.last.copy(v.group.position);
        if (v.ring) { v.ring.rotation.x = this.time * 5; v.ring.rotation.y = this.time * 3; }
        this.particles.emit(v.group.position, col(pr.color), 2, 0.6, 0.35, 0, pr.radius);
      }
      for (const id of [...this.projViews.keys()]) if (!battle.projectiles.some(pr => pr.id === id)) this.removeProjectile(id, true, false);
    }

    for (let i = 0; i < 3; i++) {
      this.laneT[i] = Math.max(0, this.laneT[i] - dt);
      const on = this.laneT[i] > 0 ? 0.28 + Math.sin(this.time * 18) * 0.12 : 0;
      this.laneMat[i].opacity += (on - this.laneMat[i].opacity) * Math.min(1, dt * 12);
    }
    this.torches.forEach((t, i) => { const f = 1.4 + Math.sin(this.time * 9 + i * 1.7) * 0.25 + Math.random() * 0.1; t.scale.set(f, f, 1); });
    this.portal.rotation.z = this.time * 0.4;
    this.player.update(dt, this.time);
    this.enemy.update(dt, this.time);
    this.particles.update(dt);

    this.shake = Math.max(0, this.shake - dt * 2.5);
    const s = this.shake * this.shake * 0.25;
    this.camera.position.x += (Math.random() - 0.5) * s;
    this.camera.position.y += (Math.random() - 0.5) * s;
    if (this.running) this.renderer.render(this.scene, this.camera);
    this.camera.position.x = 0;
    this.camera.position.y = this.camera.position.y - (this.camera.position.y - Math.round(this.camera.position.y * 1000) / 1000);
    this.resizeIfNeeded();
  }

  private resizeIfNeeded(): void {
    const c = this.renderer.domElement;
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (Math.abs(c.clientWidth - w) > 1 || Math.abs(c.clientHeight - h) > 1) this.resize();
  }

  setRunning(on: boolean): void { this.running = on; }
}
