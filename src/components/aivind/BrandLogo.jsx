import Image from "next/image";

export default function BrandLogo({ className = "", priority = false }) {
  return (
    <Image
      src="/images/tekkno-logo.png"
      alt="TEKKNO"
      width={1319}
      height={305}
      priority={priority}
      sizes="(max-width: 640px) 145px, 190px"
      className={`block h-auto w-auto object-contain ${className}`}
    />
  );
}
