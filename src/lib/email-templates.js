const brandName = "TEKKNO";
const supportEmail = process.env.EMAIL_REPLY_TO || "redaksjon@tekkno.no";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function greetingFor(user) {
  const name = String(user?.name || "").trim();
  return name ? `Hei ${name}` : "Hei";
}

function createTransactionalEmail({ preheader, title, greeting, body, actionLabel, actionUrl, securityNote }) {
  const safeActionUrl = escapeHtml(actionUrl);
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting);
  const safeBody = escapeHtml(body);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeSecurityNote = escapeHtml(securityNote);

  return `<!doctype html>
<html lang="no">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;color:#1b1c20;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f4f6;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 36px;background:#111827;border-bottom:4px solid #ff6a00;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:32px;height:32px;background:#ff6a00;border-radius:8px;text-align:center;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;color:#ffffff;line-height:32px;">T</td>
                    <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;letter-spacing:1px;color:#ffffff;">${brandName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 36px 30px;">
                <h1 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:36px;font-weight:800;color:#111827;">${safeTitle}</h1>
                <p style="margin:0 0 14px;font-size:16px;line-height:25px;color:#30343b;">${safeGreeting},</p>
                <p style="margin:0 0 28px;font-size:16px;line-height:25px;color:#30343b;">${safeBody}</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                  <tr>
                    <td align="center" bgcolor="#ff6a00" style="border-radius:8px;">
                      <a href="${safeActionUrl}" style="display:inline-block;padding:14px 22px;border-radius:8px;background:#ff6a00;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:20px;text-decoration:none;">${safeActionLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#636872;">Hvis knappen ikke fungerer, kopier denne lenken inn i nettleseren din:</p>
                <p style="margin:0;word-break:break-all;font-size:13px;line-height:20px;"><a href="${safeActionUrl}" style="color:#c75200;text-decoration:underline;">${safeActionUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 36px;background:#f8f8f9;border-top:1px solid #e6e7e9;">
                <p style="margin:0 0 10px;font-size:13px;line-height:20px;color:#565b65;">${safeSecurityNote}</p>
                <p style="margin:0;font-size:13px;line-height:20px;color:#565b65;">Trenger du hjelp? Kontakt oss på <a href="mailto:${supportEmail}" style="color:#c75200;text-decoration:underline;">${supportEmail}</a>.</p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#717680;">&copy; ${brandName}. Teknologi, forklart.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function createVerificationEmail({ user, url }) {
  const greeting = greetingFor(user);
  const subject = "Bekreft e-posten din hos TEKKNO";

  return {
    subject,
    text: `${greeting},\n\nTakk for at du opprettet konto hos TEKKNO. Bekreft e-postadressen din ved å åpne lenken nedenfor:\n\n${url}\n\nHvis du ikke opprettet en konto hos TEKKNO, kan du se bort fra denne e-posten.\n\nTEKKNO`,
    html: createTransactionalEmail({
      preheader: "Bekreft e-postadressen din og fullfør opprettelsen av kontoen.",
      title: "Bekreft e-posten din",
      greeting,
      body: "Takk for at du opprettet konto hos TEKKNO. Bekreft e-postadressen din for å fullføre opprettelsen av kontoen.",
      actionLabel: "Bekreft e-postadresse",
      actionUrl: url,
      securityNote: "Hvis du ikke opprettet en konto hos TEKKNO, kan du trygt se bort fra denne e-posten.",
    }),
  };
}

export function createPasswordResetEmail({ user, url }) {
  const greeting = greetingFor(user);
  const subject = "Tilbakestill passordet ditt hos TEKKNO";

  return {
    subject,
    text: `${greeting},\n\nVi har mottatt en forespørsel om å tilbakestille passordet ditt. Åpne lenken nedenfor for å velge et nytt passord:\n\n${url}\n\nHvis du ikke ba om å tilbakestille passordet, kan du trygt se bort fra denne e-posten.\n\nTEKKNO`,
    html: createTransactionalEmail({
      preheader: "Velg et nytt passord for TEKKNO-kontoen din.",
      title: "Tilbakestill passordet ditt",
      greeting,
      body: "Vi har mottatt en forespørsel om å tilbakestille passordet for TEKKNO-kontoen din. Bruk knappen nedenfor for å velge et nytt passord.",
      actionLabel: "Velg nytt passord",
      actionUrl: url,
      securityNote: "Hvis du ikke ba om å tilbakestille passordet, trenger du ikke å gjøre noe.",
    }),
  };
}
