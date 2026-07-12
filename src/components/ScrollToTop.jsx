import { useEffect } from "react";
import { useRouter } from "next/router";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const router = useRouter();

  useEffect(() => {
    const [, hashValue] = router.asPath.split("#");
    const hash = hashValue ? `#${hashValue}` : "";

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [router.asPath]);

  return null;
}
