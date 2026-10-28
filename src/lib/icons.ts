// Font Awesome Pro duotone icons for each option, from the DEM-11 icon map

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBagsShopping,
  faBarn,
  faBook,
  faBookSparkles,
  faBuildingColumns,
  faCactus,
  faCampfire,
  faCartShopping,
  faCastle,
  faCat,
  faDragon,
  faFaceLaugh,
  faFaceMeh,
  faFerrisWheel,
  faFireplace,
  faFrog,
  faGem,
  faGhost,
  faHatWizard,
  faHearts,
  faHouseNight,
  faHouseWindow,
  faLeafOak,
  faMountain,
  faMountains,
  faMushroom,
  faPlanetRinged,
  faSchool,
  faSkull,
  faSnowflake,
  faTornado,
  faTreeDeciduous,
  faTreePalm,
} from "@fortawesome/pro-duotone-svg-icons";
import type { CharacterKind, SliderId } from "./characters";

export const KIND_ICONS: Record<CharacterKind, IconDefinition> = {
  dragons: faDragon,
  "warrior-cats": faCat,
  teens: faBookSparkles,
  "dnd-party": faHatWizard,
};

// Keyed by the settings in CHARACTER_KINDS
const SETTING_ICONS: Record<string, IconDefinition> = {
  "a desert": faCactus,
  "a rainforest": faTreePalm,
  "a frozen tundra": faSnowflake,
  "underground crystal caverns": faGem,
  "high mountains": faMountains,
  "a forest": faTreeDeciduous,
  "a swamp": faFrog,
  "the mountains": faMountain,
  "a two-leg house": faHouseWindow,
  "a two-leg farm": faBarn,
  "a high school": faSchool,
  "a summer camp": faCampfire,
  "a theme park": faFerrisWheel,
  "the mall": faBagsShopping,
  "the underworld": faSkull,
  Costco: faCartShopping,
  "a druids' grove": faLeafOak,
  "a major city on the Sword Coast": faCastle,
  "the astral plane": faPlanetRinged,
  "the Underdark": faMushroom,
  "an ancient ruin": faBuildingColumns,
  "a peaceful village with a secret": faHouseNight,
};

export function settingIcon(setting: string): IconDefinition | undefined {
  return SETTING_ICONS[setting];
}

export const SLIDER_ICONS: Record<SliderId, { min: IconDefinition; max: IconDefinition }> = {
  scary: { min: faFireplace, max: faGhost },
  serious: { min: faFaceLaugh, max: faFaceMeh },
  romance: { min: faHearts, max: faHearts },
  chaos: { min: faBook, max: faTornado },
};
