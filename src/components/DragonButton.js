import clsx from "clsx";
import Link from "next/link";

export default function DragonButton({ children, disabled, onClick, href }) {
  const defaultClasses = "font-bold p-3 text-center min-w-[220px]";
  const classNames = clsx([
    defaultClasses,
    !disabled && "bg-pink-600 text-white",
    disabled && "bg-pink-100 text-pink-300 cursor-not-allowed",
  ]);

  if (href) {
    return (
      <Link href={href}>
        <a className={classNames}>{children}</a>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classNames}>
      {children}
    </button>
  );
}
