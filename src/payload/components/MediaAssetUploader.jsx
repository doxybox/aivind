"use client";

import { useRef, useState } from "react";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export default function MediaAssetUploader() {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setMessage("Velg JPG, PNG, WebP eller AVIF.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage("Bildet kan være maksimalt 10 MB.");
      return;
    }

    setUploading(true);
    setMessage("Oppretter trygg opplasting hos Cloudflare...");
    try {
      const response = await fetch("/api/media-assets/cloudflare-direct-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || file.name,
          alt: alt.trim(),
          originalFilename: file.name,
          fileMimeType: file.type,
          fileSizeBytes: file.size,
          requireSignedURLs: false,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Kunne ikke opprette bildeopplasting.");

      const upload = new FormData();
      upload.append("file", file);
      const uploadResponse = await fetch(data.uploadURL, { method: "POST", body: upload });
      if (!uploadResponse.ok) throw new Error("Cloudflare kunne ikke motta bildet.");

      setMessage("Bildet er lastet opp og lagt til i Media assets. Listen oppdateres nå.");
      setTitle("");
      setAlt("");
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(error?.message || "Kunne ikke laste opp bildet.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: "8px", marginBottom: "1.5rem", padding: "1rem" }}>
      <h2 style={{ fontSize: "1.1rem", margin: "0 0 .25rem" }}>Last opp bilde</h2>
      <p style={{ margin: "0 0 1rem", opacity: .72 }}>
        Bildet lastes direkte til Cloudflare Images og opprettes automatisk som et Media asset i Payload.
      </p>
      <div style={{ display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <label style={{ display: "grid", gap: ".35rem" }}>
          <span>Tittel</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Beskrivende tittel" />
        </label>
        <label style={{ display: "grid", gap: ".35rem" }}>
          <span>Alternativ tekst</span>
          <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Hva viser bildet?" />
        </label>
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={uploadImage} />
      <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} style={{ marginTop: "1rem" }}>
        {uploading ? "Laster opp..." : "Velg bilde"}
      </button>
      {message ? <p style={{ margin: ".75rem 0 0", opacity: .8 }} role="status">{message}</p> : null}
    </section>
  );
}
