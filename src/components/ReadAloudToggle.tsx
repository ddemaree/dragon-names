import clsx from "clsx";
import { faVolumeHigh } from "@fortawesome/pro-duotone-svg-icons";
import Icon from "./Icon";

type Props = { on: boolean; onToggle: () => void };

export default function ReadAloudToggle({ on, onToggle }: Props) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={clsx(
        "flex min-h-11 items-center gap-2.5 self-center rounded-full border py-2 pr-2 pl-4 text-[15px] font-semibold",
        on ? "border-sky bg-sky/10" : "border-white/28",
      )}
    >
      <Icon icon={faVolumeHigh} primary="#fff" secondary="var(--color-sky)" className="text-xl" />
      Read it to me
      <span className={clsx("flex h-7 w-12 flex-none items-center rounded-full p-1", on ? "bg-sky" : "bg-white/20")}>
        <span className={clsx("size-5 rounded-full bg-white transition-transform", on && "translate-x-5")} />
      </span>
    </button>
  );
}
