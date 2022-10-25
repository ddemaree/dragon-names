import clsx from "clsx";
import Link from "next/link";
import DragonIcon from "./DragonIcon";

export default function Layout({ children, width = "normal" }) {
  const innerClassNames = clsx([
    "bg-white p-8 w-full",
    width === "normal" && "max-w-xl",
    width === "wide" && "max-w-3xl",
  ]);

  return (
    <div className="text-center bg-pink-300 min-h-screen flex flex-col items-center justify-center font-spectral">
      <div className={innerClassNames}>
        <Link href="/">
          <a>
            <DragonIcon />
          </a>
        </Link>

        {children}
      </div>
    </div>
  );
}
