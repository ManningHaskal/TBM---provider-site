import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: "sm" | "lg";
  showTagline?: boolean;
  variant?: "default" | "hero" | "dark";
};

export function Logo({
  size = "sm",
  showTagline = false,
  variant = "default",
}: LogoProps) {
  const imageSize = size === "lg" ? 140 : 64;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Image
        src="/texbiomed-logo.webp"
        alt="TexBioMed"
        width={imageSize}
        height={imageSize}
        className={`h-auto w-auto object-contain ${size === "lg" ? "max-h-32" : "max-h-16"}`}
        priority
      />
      {showTagline ? (
        <p
          className={`text-sm font-medium tracking-wide ${
            variant === "hero" || variant === "dark"
              ? "text-white/90"
              : "text-tbm-text-muted"
          }`}
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
