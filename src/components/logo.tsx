import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: "sm" | "lg";
  showTagline?: boolean;
  variant?: "default" | "hero";
};

export function Logo({
  size = "sm",
  showTagline = false,
  variant = "default",
}: LogoProps) {
  const imageSize = size === "lg" ? 120 : 56;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Image
        src="/texbiomed-logo.webp"
        alt="TexBioMed"
        width={imageSize}
        height={imageSize}
        className={`h-auto w-auto object-contain ${size === "lg" ? "max-h-28" : "max-h-14"}`}
        priority
      />
      {showTagline ? (
        <p
          className={`text-sm ${variant === "hero" ? "text-teal-50" : "text-slate-600"}`}
        >
          Provider ordering portal
        </p>
      ) : null}
    </div>
  );
}

export function LogoLink({ size = "sm" }: Pick<LogoProps, "size">) {
  return (
    <Link href="/home" className="inline-flex">
      <Logo size={size} />
    </Link>
  );
}
