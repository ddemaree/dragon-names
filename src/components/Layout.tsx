import clsx from "clsx";
import Link from "next/link";
import DragonIcon from "./DragonIcon";

type Props = {
  children: React.ReactNode;
  width?: "normal" | "wide";
};

export default function Layout({ children, width = "normal" }: Props) {
  const innerClassNames = clsx([
    "bg-white p-8 w-full",
    width === "normal" && "max-w-xl",
    width === "wide" && "max-w-3xl",
  ]);

  return (
    <div className="text-center bg-pink-300 min-h-screen flex flex-col items-center justify-center font-spectral">
      <div className={innerClassNames}>
        <Link href="/">
          <DragonIcon />
        </Link>

        {children}
      </div>
    </div>
  );
}
