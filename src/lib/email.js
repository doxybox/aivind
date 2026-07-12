const resendEndpoint = "https://api.resend.com/emails";

export async function sendAuthEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[auth email]", { to, subject, text });
      return;
    }

    throw new Error("Missing RESEND_API_KEY or EMAIL_FROM");
  }

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider failed with ${response.status}`);
  }
}
