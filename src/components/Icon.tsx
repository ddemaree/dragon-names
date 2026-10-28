import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  icon: IconDefinition;
  primary: string;
  secondary: string;
  className?: string;
};

// A duotone icon with both layers at full strength, as in the Night flight design
export default function Icon({ icon, primary, secondary, className }: Props) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      style={{
        "--fa-primary-color": primary,
        "--fa-secondary-color": secondary,
        "--fa-secondary-opacity": "1",
      }}
    />
  );
}
