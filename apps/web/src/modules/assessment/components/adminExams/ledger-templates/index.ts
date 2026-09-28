import { ClassicAcademic } from './ClassicAcademic';
import { ModernMinimalist } from './ModernMinimalist';
import { RoyalExecutive } from './RoyalExecutive';
import { VintageLedger } from './VintageLedger';
import { TealClean } from './TealClean';

export { ClassicAcademic } from './ClassicAcademic';
export { ModernMinimalist } from './ModernMinimalist';
export { RoyalExecutive } from './RoyalExecutive';
export { VintageLedger } from './VintageLedger';
export { TealClean } from './TealClean';

export const LEDGER_TEMPLATES = [
  { id: 'classic', name: 'Classic Academic', component: ClassicAcademic },
  { id: 'modern', name: 'Modern Minimalist', component: ModernMinimalist },
  { id: 'royal', name: 'Royal Executive', component: RoyalExecutive },
  { id: 'vintage', name: 'Vintage Ledger', component: VintageLedger },
  { id: 'teal', name: 'Teal Clean', component: TealClean },
];
