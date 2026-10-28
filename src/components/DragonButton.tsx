import clsx from "clsx";
import Link from "next/link";
import { faWandMagicSparkles } from "@fortawesome/pro-duotone-svg-icons";
import Icon from "./Icon";

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
};

export default function DragonButton({ children, disabled, onClick, href }: Props) {
  const classNames = clsx(
    "flex h-16 w-full max-w-85 items-center justify-center gap-3 self-center rounded-full px-8 text-xl font-bold text-night",
    "bg-linear-to-r from-pink via-peach to-pale-sky shadow-[0_0_40px_rgb(255_143_200/0.45)]",
    disabled && "cursor-wait opacity-70",
  );
  const content = (
    <>
      <Icon icon={faWandMagicSparkles} primary="var(--color-night)" secondary="var(--color-violet)" className="text-2xl" />
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classNames}>
      {content}
    </button>
  );
}
