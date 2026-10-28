import clsx from "clsx";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
};

export default function DragonButton({ children, disabled, onClick, href }: Props) {
  const defaultClasses = "font-bold p-3 text-center min-w-[220px]";
  const classNames = clsx([
    defaultClasses,
    !disabled && "bg-pink-600 text-white",
    disabled && "bg-pink-100 text-pink-300 cursor-not-allowed",
  ]);

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classNames}>
      {children}
    </button>
  );
}
