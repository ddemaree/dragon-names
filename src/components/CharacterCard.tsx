import {
  CHARACTER_KINDS,
  type CharacterKind,
  isSliderId,
  SLIDERS,
  type SliderId,
  withArticle,
} from "@/lib/characters";
import { KIND_ICONS, settingIcon, SLIDER_ICONS } from "@/lib/icons";
import Icon from "./Icon";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type Props = {
  kind: CharacterKind;
  name: string;
  type: string;
  setting?: string;
  sliders?: Partial<Record<SliderId, number>>;
};

// Sliders pushed toward either end show up as a mood chip; "No romance" is the default, so it doesn't
type Chip = { id: string; label: string; icon: IconDefinition };

function moodChips(sliders: Partial<Record<SliderId, number>>): Chip[] {
  return Object.entries(sliders).flatMap<Chip>(([id, value]) => {
    if (!isSliderId(id) || value === undefined) return [];
    if (value >= 7) return [{ id, label: SLIDERS[id].max, icon: SLIDER_ICONS[id].max }];
    if (value <= 3 && id !== "romance") return [{ id, label: SLIDERS[id].min, icon: SLIDER_ICONS[id].min }];
    return [];
  });
}

export default function CharacterCard({ kind, name, type, setting, sliders = {} }: Props) {
  const { nameLabel, typeLabel } = CHARACTER_KINDS[kind];
  // Party members are a list, so they don't get an article
  const typeText = kind === "dnd-party" ? type : withArticle(type);
  const chips: Chip[] = [
    ...(setting
      ? [{ id: "setting", label: setting.charAt(0).toUpperCase() + setting.slice(1), icon: settingIcon(setting) ?? KIND_ICONS[kind] }]
      : []),
    ...moodChips(sliders),
  ];

  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <p className="text-muted">{nameLabel}</p>
      <h1 className="font-display text-6xl leading-[0.9] font-light tracking-tight text-white [text-shadow:0_0_40px_rgb(255_143_200/0.6)] sm:text-8xl">
        {name}
      </h1>
      <p className="mt-1 text-muted">{typeLabel}</p>
      <p className="text-2xl font-semibold tracking-wider text-peach [font-variant-caps:all-small-caps]">{typeText}</p>
      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {chips.map((chip) => (
            <li key={chip.id} className="flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-sm">
              <Icon icon={chip.icon} primary="#fff" secondary="var(--color-sky)" />
              {chip.label}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
