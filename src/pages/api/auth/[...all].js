import { auth } from "@/lib/auth";
import { isEmailSelfServiceEnabled, isEmailSelfServicePath } from "@/lib/auth-launch-mode";
import { toNodeHandler } from "better-auth/node";

export const config = {
  api: {
    bodyParser: false,
  },
};

const authHandler = toNodeHandler(auth.handler);

export default function handler(req, res) {
  if (!isEmailSelfServiceEnabled() && isEmailSelfServicePath(req.url || "")) {
    return res.status(503).json({
      error: "Selvbetjent registrering og passordhjelp er ikke tilgjengelig ennå.",
    });
  }

  return authHandler(req, res);
}
