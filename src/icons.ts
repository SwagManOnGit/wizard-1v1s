// Hand-painted canvas icons for gear and upgrades, so the shop has emblems without image files.
import type { EquipSlot } from './data';

export const TIER_COLORS = ['#b08d57', '#c9ced6', '#ffcf40', '#b98cff', '#ff8a3d'];   // bronze, silver, gold, arcane, legendary

type Painter = (g: CanvasRenderingContext2D, s: number, c: string) => void;

function stroke(g: CanvasRenderingContext2D, c: string, w: number): void {
  g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
}

function star(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, n = 4): void {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.4;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
}

const GEAR: Record<EquipSlot, Painter> = {
  wand(g, s, c) {
    stroke(g, '#7a4b22', s * 0.09);
    g.beginPath(); g.moveTo(s * 0.25, s * 0.78); g.lineTo(s * 0.68, s * 0.34); g.stroke();
    stroke(g, '#5a3315', s * 0.03); g.stroke();
    g.fillStyle = c; star(g, s * 0.72, s * 0.28, s * 0.16, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; star(g, s * 0.72, s * 0.28, s * 0.06, 4); g.fill();
  },
  robe(g, s, c) {
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(s * 0.5, s * 0.18); g.lineTo(s * 0.36, s * 0.24); g.lineTo(s * 0.2, s * 0.42); g.lineTo(s * 0.28, s * 0.5);
    g.lineTo(s * 0.24, s * 0.84); g.lineTo(s * 0.76, s * 0.84); g.lineTo(s * 0.72, s * 0.5); g.lineTo(s * 0.8, s * 0.42);
    g.lineTo(s * 0.64, s * 0.24); g.closePath(); g.fill();
    stroke(g, 'rgba(0,0,0,0.35)', s * 0.03); g.beginPath(); g.moveTo(s * 0.5, s * 0.22); g.lineTo(s * 0.5, s * 0.82); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(s * 0.5, s * 0.18); g.lineTo(s * 0.42, s * 0.34); g.lineTo(s * 0.58, s * 0.34); g.closePath(); g.fill();
  },
  charm(g, s, c) {
    stroke(g, '#c9a24a', s * 0.05);
    g.beginPath(); g.moveTo(s * 0.32, s * 0.16); g.quadraticCurveTo(s * 0.5, s * 0.02, s * 0.68, s * 0.16); g.stroke();
    g.beginPath(); g.moveTo(s * 0.5, s * 0.36); g.lineTo(s * 0.32, s * 0.16); g.moveTo(s * 0.5, s * 0.36); g.lineTo(s * 0.68, s * 0.16); g.stroke();
    g.fillStyle = c; g.beginPath(); g.moveTo(s * 0.5, s * 0.34); g.lineTo(s * 0.74, s * 0.56); g.lineTo(s * 0.5, s * 0.86); g.lineTo(s * 0.26, s * 0.56); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(s * 0.5, s * 0.4); g.lineTo(s * 0.62, s * 0.54); g.lineTo(s * 0.5, s * 0.6); g.lineTo(s * 0.38, s * 0.54); g.closePath(); g.fill();
  },
  boots(g, s, c) {
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(s * 0.34, s * 0.16); g.lineTo(s * 0.58, s * 0.16); g.lineTo(s * 0.58, s * 0.56); g.lineTo(s * 0.8, s * 0.7); g.lineTo(s * 0.8, s * 0.82);
    g.lineTo(s * 0.26, s * 0.82); g.lineTo(s * 0.26, s * 0.6); g.lineTo(s * 0.34, s * 0.5); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(s * 0.26, s * 0.74, s * 0.54, s * 0.08);
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(s * 0.34, s * 0.16, s * 0.24, s * 0.07);
    stroke(g, 'rgba(255,255,255,0.5)', s * 0.03); g.beginPath(); g.moveTo(s * 0.62, s * 0.4); g.lineTo(s * 0.9, s * 0.34); g.moveTo(s * 0.62, s * 0.48); g.lineTo(s * 0.88, s * 0.46); g.stroke();
  },
};

const UPGRADE: Record<string, Painter> = {
  vitality(g, s, c) {
    g.fillStyle = c;
    g.beginPath(); g.moveTo(s * 0.5, s * 0.84);
    g.bezierCurveTo(s * 0.1, s * 0.56, s * 0.16, s * 0.16, s * 0.5, s * 0.34);
    g.bezierCurveTo(s * 0.84, s * 0.16, s * 0.9, s * 0.56, s * 0.5, s * 0.84); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(s * 0.36, s * 0.38, s * 0.07, s * 0.05, -0.6, 0, Math.PI * 2); g.fill();
  },
  wisdom(g, s, c) {
    stroke(g, '#d9cfa8', s * 0.05);
    g.beginPath(); g.moveTo(s * 0.42, s * 0.14); g.lineTo(s * 0.58, s * 0.14); g.lineTo(s * 0.58, s * 0.34);
    g.quadraticCurveTo(s * 0.86, s * 0.5, s * 0.74, s * 0.84); g.lineTo(s * 0.26, s * 0.84); g.quadraticCurveTo(s * 0.14, s * 0.5, s * 0.42, s * 0.34); g.closePath(); g.stroke();
    g.fillStyle = c; g.beginPath(); g.moveTo(s * 0.3, s * 0.56); g.quadraticCurveTo(s * 0.5, s * 0.5, s * 0.7, s * 0.56); g.lineTo(s * 0.72, s * 0.8); g.lineTo(s * 0.28, s * 0.8); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(s * 0.6, s * 0.66, s * 0.04, 0, Math.PI * 2); g.fill();
  },
  focus(g, s, c) {
    stroke(g, c, s * 0.06);
    g.beginPath(); g.moveTo(s * 0.14, s * 0.5); g.quadraticCurveTo(s * 0.5, s * 0.1, s * 0.86, s * 0.5); g.quadraticCurveTo(s * 0.5, s * 0.9, s * 0.14, s * 0.5); g.stroke();
    g.fillStyle = c; g.beginPath(); g.arc(s * 0.5, s * 0.5, s * 0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a1030'; g.beginPath(); g.arc(s * 0.5, s * 0.5, s * 0.07, 0, Math.PI * 2); g.fill();
  },
  power(g, s, c) {
    g.fillStyle = c;
    g.beginPath(); g.moveTo(s * 0.5, s * 0.1); g.quadraticCurveTo(s * 0.86, s * 0.42, s * 0.66, s * 0.72);
    g.quadraticCurveTo(s * 0.72, s * 0.86, s * 0.5, s * 0.9); g.quadraticCurveTo(s * 0.28, s * 0.86, s * 0.34, s * 0.72);
    g.quadraticCurveTo(s * 0.14, s * 0.42, s * 0.5, s * 0.1); g.fill();
    g.fillStyle = '#fff3a8'; g.beginPath(); g.moveTo(s * 0.5, s * 0.42); g.quadraticCurveTo(s * 0.66, s * 0.62, s * 0.5, s * 0.82); g.quadraticCurveTo(s * 0.34, s * 0.62, s * 0.5, s * 0.42); g.fill();
  },
  resolve(g, s, c) {
    g.fillStyle = c;
    g.beginPath(); g.moveTo(s * 0.5, s * 0.1); g.lineTo(s * 0.84, s * 0.22); g.quadraticCurveTo(s * 0.84, s * 0.68, s * 0.5, s * 0.9);
    g.quadraticCurveTo(s * 0.16, s * 0.68, s * 0.16, s * 0.22); g.closePath(); g.fill();
    stroke(g, 'rgba(255,255,255,0.55)', s * 0.06); g.beginPath(); g.moveTo(s * 0.5, s * 0.28); g.lineTo(s * 0.5, s * 0.7); g.moveTo(s * 0.32, s * 0.44); g.lineTo(s * 0.68, s * 0.44); g.stroke();
  },
  agility(g, s, c) {
    stroke(g, c, s * 0.07);
    g.beginPath(); g.moveTo(s * 0.18, s * 0.76); g.quadraticCurveTo(s * 0.3, s * 0.3, s * 0.82, s * 0.2); g.quadraticCurveTo(s * 0.7, s * 0.66, s * 0.3, s * 0.7); g.stroke();
    stroke(g, 'rgba(255,255,255,0.5)', s * 0.03); g.beginPath(); g.moveTo(s * 0.24, s * 0.7); g.lineTo(s * 0.78, s * 0.24); g.stroke();
  },
  endurance(g, s, c) {
    g.fillStyle = c;
    g.beginPath(); g.moveTo(s * 0.56, s * 0.08); g.lineTo(s * 0.26, s * 0.54); g.lineTo(s * 0.48, s * 0.54); g.lineTo(s * 0.4, s * 0.92); g.lineTo(s * 0.76, s * 0.42); g.lineTo(s * 0.54, s * 0.42); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(s * 0.56, s * 0.12); g.lineTo(s * 0.34, s * 0.5); g.lineTo(s * 0.44, s * 0.5); g.closePath(); g.fill();
  },
  grimoire(g, s, c) {
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.roundRect(s * 0.2, s * 0.14, s * 0.6, s * 0.72, s * 0.05); g.fill();
    g.fillStyle = c; g.beginPath(); g.roundRect(s * 0.26, s * 0.2, s * 0.5, s * 0.6, s * 0.03); g.fill();
    g.fillStyle = '#e8d5a8'; g.fillRect(s * 0.74, s * 0.2, s * 0.06, s * 0.6);
    stroke(g, 'rgba(255,255,255,0.7)', s * 0.04); g.beginPath(); g.arc(s * 0.5, s * 0.5, s * 0.12, 0, Math.PI * 2); g.moveTo(s * 0.5, s * 0.38); g.lineTo(s * 0.5, s * 0.62); g.stroke();
  },
};

function makeCanvas(size: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = size * dpr; c.height = size * dpr;
  c.style.width = `${size}px`; c.style.height = `${size}px`;
  const g = c.getContext('2d')!;
  g.scale(dpr, dpr);
  paint(g);
  return c;
}

/** Medallion background shared by all emblems. */
function medallion(g: CanvasRenderingContext2D, s: number, rim: string): void {
  const grad = g.createRadialGradient(s * 0.4, s * 0.35, s * 0.05, s * 0.5, s * 0.5, s * 0.5);
  grad.addColorStop(0, '#3a2a55'); grad.addColorStop(1, '#16102a');
  g.fillStyle = grad; g.beginPath(); g.arc(s / 2, s / 2, s * 0.47, 0, Math.PI * 2); g.fill();
  stroke(g, rim, s * 0.05); g.stroke();
  stroke(g, 'rgba(255,255,255,0.25)', s * 0.015); g.beginPath(); g.arc(s / 2, s / 2, s * 0.41, 0, Math.PI * 2); g.stroke();
}

export function gearIcon(slot: EquipSlot, tier: number, size = 44): HTMLCanvasElement {
  const color = TIER_COLORS[Math.max(0, Math.min(TIER_COLORS.length - 1, tier - 1))];
  return makeCanvas(size, g => { medallion(g, size, color); GEAR[slot](g, size, color); });
}

export function upgradeIcon(id: string, size = 44): HTMLCanvasElement {
  const colors: Record<string, string> = {
    vitality: '#ff4d6d', wisdom: '#4fc3ff', focus: '#c9b3ff', power: '#ff7a1a', resolve: '#6ea8ff', agility: '#d8fff4', endurance: '#ffd166', grimoire: '#9b5cff',
  };
  const paint = UPGRADE[id];
  return makeCanvas(size, g => { medallion(g, size, '#c9a24a'); if (paint) paint(g, size, colors[id] ?? '#ffffff'); });
}

export function slotIcon(slot: EquipSlot, size = 28): HTMLCanvasElement {
  return makeCanvas(size, g => GEAR[slot](g, size, '#d9cfa8'));
}
