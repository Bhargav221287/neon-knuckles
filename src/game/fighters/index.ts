import { FighterDefinition } from '../types';
import { kazeDefinition } from './kaze';
import { brutusDefinition } from './brutus';
import { miraDefinition } from './mira';
import { roninDefinition } from './ronin';
import { voltDefinition } from './volt';
import { sableDefinition } from './sable';
import { titanDefinition } from './titan';
import { zeroDefinition } from './zero';

export const ALL_FIGHTERS: FighterDefinition[] = [
  kazeDefinition,
  brutusDefinition,
  miraDefinition,
  roninDefinition,
  voltDefinition,
  sableDefinition,
  titanDefinition,
  zeroDefinition,
];

export const FIGHTER_MAP: Record<string, FighterDefinition> = {
  kaze: kazeDefinition,
  brutus: brutusDefinition,
  mira: miraDefinition,
  ronin: roninDefinition,
  volt: voltDefinition,
  sable: sableDefinition,
  titan: titanDefinition,
  zero: zeroDefinition,
};

export function getFighter(id: string): FighterDefinition {
  return FIGHTER_MAP[id] || kazeDefinition;
}

export function isFighterUnlocked(
  fighterId: string,
  unlockedList: string[] = ['kaze', 'brutus', 'mira', 'ronin', 'volt', 'sable']
): boolean {
  const def = FIGHTER_MAP[fighterId];
  if (!def) return false;
  if (!def.unlockCondition || def.unlockCondition === 'none') {
    return true;
  }
  return unlockedList.includes(fighterId);
}

export {
  kazeDefinition,
  brutusDefinition,
  miraDefinition,
  roninDefinition,
  voltDefinition,
  sableDefinition,
  titanDefinition,
  zeroDefinition,
};
