import Image from "next/image";

import { mesclarClasses } from "@/utils/mesclarClasses";

export function BrandMark({ suffix, className }: { suffix?: string; className?: string }) {
  return (
    <span className={mesclarClasses("flex items-center gap-2 text-sm font-semibold tracking-tight", className)}>
      <Image
        src="/smartlocker_logo.png"
        alt=""
        width={28}
        height={28}
        className="rounded-md"
      />
      SmartLocker
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}
