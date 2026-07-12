import { redirectForAuthError, requireAuth } from "@/lib/server/auth-helpers";

export { default } from "@/pages/MinSide";

export async function getServerSideProps({ req }) {
  try {
    await requireAuth(req);
    return { props: {} };
  } catch (error) {
    return redirectForAuthError(error);
  }
}
