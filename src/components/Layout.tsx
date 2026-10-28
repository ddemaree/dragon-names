import Link from "next/link";
import { faDragon } from "@fortawesome/pro-duotone-svg-icons";
import Icon from "./Icon";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="night-sky flex min-h-screen justify-center px-4 py-16 font-sans">
      <main className="flex w-full max-w-180 flex-col gap-10">
        <Link href="/" aria-label="June's Dragon Generator" className="self-center">
          <Icon icon={faDragon} primary="var(--color-pink)" secondary="var(--color-sky)" className="text-7xl" />
        </Link>

        {children}
      </main>
    </div>
  );
}
