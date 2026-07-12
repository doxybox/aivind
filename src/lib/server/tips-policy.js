const CATEGORY_ALLOWLIST = new Set(["Nyhet", "Trafikk", "Sport", "Politikk", "Kultur", "Arrangement", "Annet"]);

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

export function validateTipSubmissionInput(input = {}) {
  const title = cleanString(input.title, 160);
  const message = cleanString(input.description || input.message, 4000);
  const category = CATEGORY_ALLOWLIST.has(input.category) ? input.category : "Annet";

  if (title.length < 3) {
    const error = new Error("Tittel mangler eller er for kort.");
    error.status = 400;
    throw error;
  }

  if (message.length < 10) {
    const error = new Error("Beskrivelse mangler eller er for kort.");
    error.status = 400;
    throw error;
  }

  return { title, message, category };
}
