import Image from "next/image";

export default function BrandLogo({ className = "", priority = false }) {
  return (
    <>
      <Image
        src="/images/tekkno-logo-dark.png"
        alt="TEKKNO"
        width={1283}
        height={184}
        priority={priority}
        sizes="(max-width: 640px) 145px, 190px"
        className={`block h-auto w-auto object-contain dark:hidden ${className}`}
      />
      <Image
        src="/images/tekkno-logo-light.png"
        alt="TEKKNO"
        width={1309}
        height={173}
        priority={priority}
        sizes="(max-width: 640px) 145px, 190px"
        className={`hidden h-auto w-auto object-contain dark:block ${className}`}
      />
    </>
  );
}
