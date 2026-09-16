// Persistent progress: parsed defensively so older save formats keep loading.
import { BASE_SLOTS, EQUIP_BY_ID, EQUIP_SLOTS, PLAYER_BASE, SPELL_BY_ID, STARTING_SPELLS, UPGRADES, type EquipSlot } from './data';

export interface SaveData {
  v: 1;
  coins: number;
  level: number;               // next level to play (1-based)
  best: number;                // highest level cleared
  owned: string[];             // spell ids
  loadout: string[];           // equipped spell ids (order = HUD order)
  upgrades: Record<string, number>;
  equipOwned: string[];
  equipped: Partial<Record<EquipSlot, string>>;
  wins: number;
  losses: number;
  earned: number;
  adsWatched: number;
}

export function defaultSave(): SaveData {
  return {
    v: 1, coins: 0, level: 1, best: 0,
    owned: [...STARTING_SPELLS], loadout: [...STARTING_SPELLS],
    upgrades: {}, equipOwned: [], equipped: {}, wins: 0, losses: 0, earned: 0, adsWatched: 0,
  };
}

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export function parseSave(raw: string | null): SaveData {
  const d = defaultSave();
  if (!raw) return d;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    d.coins = Math.max(0, Math.floor(num(o.coins, 0)));
    d.level = Math.max(1, Math.floor(num(o.level, 1)));
    d.best = Math.max(0, Math.floor(num(o.best, 0)));
    const owned = new Set([...STARTING_SPELLS, ...strList(o.owned).filter(id => SPELL_BY_ID[id])]);
    d.owned = [...owned];
    const loadout = strList(o.loadout).filter(id => owned.has(id));
    d.loadout = loadout.length ? loadout : [...STARTING_SPELLS];
    d.upgrades = {};
    if (o.upgrades && typeof o.upgrades === 'object') {
      for (const u of UPGRADES) d.upgrades[u.id] = Math.min(u.max, Math.max(0, Math.floor(num((o.upgrades as Record<string, unknown>)[u.id], 0))));
    }
    d.equipOwned = strList(o.equipOwned).filter(id => EQUIP_BY_ID[id]);
    d.equipped = {};
    if (o.equipped && typeof o.equipped === 'object') {
      for (const s of EQUIP_SLOTS) {
        const id = (o.equipped as Record<string, unknown>)[s.id];
        if (typeof id === 'string' && EQUIP_BY_ID[id] && d.equipOwned.includes(id) && EQUIP_BY_ID[id].slot === s.id) d.equipped[s.id] = id;
      }
    }
    d.wins = Math.max(0, Math.floor(num(o.wins, 0)));
    d.losses = Math.max(0, Math.floor(num(o.losses, 0)));
    d.earned = Math.max(0, Math.floor(num(o.earned, 0)));
    d.adsWatched = Math.max(0, Math.floor(num(o.adsWatched, 0)));
  } catch { /* corrupt save: start fresh */ }
  const stats = computeStats(d);
  d.loadout = d.loadout.slice(0, stats.slots);
  return d;
}

export interface PlayerStats {
  maxHp: number; maxMana: number; regen: number; power: number; healMult: number; shieldMult: number;
  iframes: number; costMult: number; coinMult: number; slots: number; revive: number;
}

export function computeStats(s: SaveData): PlayerStats {
  const r = (id: string): number => s.upgrades[id] ?? 0;
  const st: PlayerStats = {
    maxHp: PLAYER_BASE.hp + 20 * r('vitality'),
    maxMana: PLAYER_BASE.mana + 10 * r('wisdom'),
    regen: PLAYER_BASE.regen + 1.5 * r('focus'),
    power: 1 + 0.08 * r('power'),
    healMult: 1 + 0.1 * r('resolve'),
    shieldMult: 1 + 0.1 * r('resolve'),
    iframes: PLAYER_BASE.iframes + 0.07 * r('agility'),
    costMult: 1,
    coinMult: 1,
    slots: BASE_SLOTS + r('grimoire'),
    revive: 0,
  };
  for (const slot of EQUIP_SLOTS) {
    const id = s.equipped[slot.id];
    const e = id ? EQUIP_BY_ID[id] : undefined;
    if (!e) continue;
    st.power += e.power ?? 0;
    st.maxHp += e.hp ?? 0;
    st.maxMana += e.mana ?? 0;
    st.regen += e.regen ?? 0;
    st.costMult *= e.costMult ?? 1;
    st.healMult *= e.healMult ?? 1;
    st.shieldMult *= e.shieldMult ?? 1;
    st.coinMult *= e.coinMult ?? 1;
    st.revive = Math.max(st.revive, e.revive ?? 0);
  }
  return st;
}
