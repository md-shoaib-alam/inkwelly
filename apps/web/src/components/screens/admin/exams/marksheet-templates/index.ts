import { ClassicAcademy } from './ClassicAcademy';
import { ModernMinimalist } from './ModernMinimalist';
import { RoyalGold } from './RoyalGold';
import { CreativeCompact } from './CreativeCompact';
import { CBSEStandard } from './CBSEStandard';
import { ICSESemester } from './ICSESemester';
import { StateBoardGreen } from './StateBoardGreen';

export { ClassicAcademy } from './ClassicAcademy';
export { ModernMinimalist } from './ModernMinimalist';
export { RoyalGold } from './RoyalGold';
export { CreativeCompact } from './CreativeCompact';
export { CBSEStandard } from './CBSEStandard';
export { ICSESemester } from './ICSESemester';
export { StateBoardGreen } from './StateBoardGreen';

export const MARKSHEET_TEMPLATES = [
  { id: 'classic', name: 'Classic Academy', component: ClassicAcademy },
  { id: 'modern', name: 'Modern Minimalist', component: ModernMinimalist },
  { id: 'royal', name: 'Royal Gold Elite', component: RoyalGold },
  { id: 'creative', name: 'Creative Compact', component: CreativeCompact },
  { id: 'cbse', name: 'CBSE Public School', component: CBSEStandard },
  { id: 'icse', name: 'ICSE Semester Convent', component: ICSESemester },
  { id: 'stateboard', name: 'State Board Green-Elite', component: StateBoardGreen },
];
