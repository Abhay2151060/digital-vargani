import { Language } from '@vargani/types';

export interface BuildingDefinition {
  mr: string;
  en: string;
}

export const BUILDINGS: BuildingDefinition[] = [
  { mr: 'निकिता हाइट्स', en: 'Nikita Heights' },
  { mr: 'सीताई निवास', en: 'Sitai Nivas' },
  { mr: 'अथर्व', en: 'Atharva' },
  { mr: 'काजल', en: 'Kajal' },
  { mr: 'साईव्हिला', en: 'Sai Villa' },
  { mr: 'सुतेजा अ विंग', en: 'Suteja A Wing' },
  { mr: 'सुतेजा बी विंग', en: 'Suteja B Wing' },
  { mr: 'साईराम', en: 'Sairam' },
  { mr: 'श्री विजय', en: 'Shri Vijay' },
  { mr: 'सुयश हेरिटेज', en: 'Suyash Heritage' },
  { mr: 'विजयालक्ष्मी', en: 'Vijayalakshmi' },
  { mr: 'गुलमोहर', en: 'Gulmohar' },
  { mr: 'श्री निधी', en: 'Shri Nidhi' },
  { mr: 'प्रथमेश', en: 'Prathamesh' },
  { mr: 'ऑर्किड', en: 'Orchid' },
  { mr: 'सोहम', en: 'Soham' },
];

/**
 * Given a flat/building string which may contain English, Marathi or combined names,
 * formats the building name to match the target language.
 */
export function formatBuildingDisplay(rawAddress: string | undefined | null, lang: Language): string {
  if (!rawAddress) return '';
  let result = rawAddress;
  for (const b of BUILDINGS) {
    if (lang === Language.ENGLISH) {
      // Convert Marathi names or combined "मराठी — English" to pure English
      if (result.includes(`${b.mr} — ${b.en}`)) {
        result = result.replace(`${b.mr} — ${b.en}`, b.en);
      } else if (result.includes(b.mr)) {
        result = result.replace(b.mr, b.en);
      }
    } else {
      // Convert English names or combined "मराठी — English" to pure Marathi
      if (result.includes(`${b.mr} — ${b.en}`)) {
        result = result.replace(`${b.mr} — ${b.en}`, b.mr);
      } else if (result.includes(b.en)) {
        result = result.replace(b.en, b.mr);
      }
    }
  }
  return result;
}
