"use client";

import { useRef, useState } from "react";

const IMAGE_UPLOAD = {
  label: "bilde",
  maxBytes: 10 * 1024 * 1024,
  acceptedTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  accept: "image/jpeg,image/png,image/webp,image/avif",
  endpoint: "/api/media-assets/cloudflare-direct-upload",
};

const VIDEO_UPLOAD = {
  label: "video",
  maxBytes: 500 * 1024 * 1024,
  acceptedTypes: new Set(["video/mp4", "video/quicktime", "video/webm"]),
  accept: "video/mp4,video/quicktime,video/webm",
  endpoint: "/api/media-assets/cloudflare-stream-direct-upload",
};

function formatMegabytes(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export default function MediaAssetUploader() {
  const fileInputRef = useRef(null);
  const [kind, setKind] = useState("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadConfig = kind === "video" ? VIDEO_UPLOAD : IMAGE_UPLOAD;

  async function uploadMedia(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!uploadConfig.acceptedTypes.has(file.type)) {
      setMessage(kind === "video" ? "Velg MP4, MOV eller WebM." : "Velg JPG, PNG, WebP eller AVIF.");
      return;
    }
    if (file.size > uploadConfig.maxBytes) {
      setMessage(`${uploadConfig.label[0].toUpperCase()}${uploadConfig.label.slice(1)}filen kan være maksimalt ${formatMegabytes(uploadConfig.maxBytes)}.`);
      return;
    }

    setUploading(true);
    setMessage(`Oppretter trygg ${uploadConfig.label}opplasting hos Cloudflare...`);
    try {
      const response = await fetch(uploadConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || file.name,
          ...(kind === "video" ? { description: description.trim() } : { alt: description.trim() }),
          originalFilename: file.name,
          fileMimeType: file.type,
          fileSizeBytes: file.size,
          requireSignedURLs: false,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `Kunne ikke opprette ${uploadConfig.label}opplasting.`);

      let uploadResponse;
      if (kind === "video") {
        uploadResponse = await fetch(data.uploadURL, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/offset+octet-stream",
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": "0",
          },
          body: file,
        });
      } else {
        const upload = new FormData();
        upload.append("file", file);
        uploadResponse = await fetch(data.uploadURL, { method: "POST", body: upload });
      }
      if (!uploadResponse.ok) throw new Error(`Cloudflare kunne ikke motta ${uploadConfig.label}filen.`);

      setMessage(kind === "video"
        ? "Videoen er lastet opp og behandles hos Cloudflare Stream. Media assets oppdateres nå."
        : "Bildet er lastet opp og lagt til i Media assets. Listen oppdateres nå.");
      setTitle("");
      setDescription("");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setMessage(error?.message || `Kunne ikke laste opp ${uploadConfig.label}filen.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: "8px", marginBottom: "1.5rem", padding: "1rem" }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: ".5rem", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", margin: "0 0 .25rem" }}>Last opp media</h2>
          <p style={{ margin: 0, opacity: .72 }}>
            Bilder lastes til Cloudflare Images. Videoer lastes til Cloudflare Stream og opprettes som video-assets i Payload.
          </p>
        </div>
        <div aria-label="Velg medietype" style={{ display: "flex", gap: ".4rem" }}>
          <button type="button" onClick={() => setKind("image")} aria-pressed={kind === "image"}>Bilde</button>
          <button type="button" onClick={() => setKind("video")} aria-pressed={kind === "video"}>Video</button>
        </div>
      </div>
      <div style={{ display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: "1rem" }}>
        <label style={{ display: "grid", gap: ".35rem" }}>
          <span>Tittel</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === "video" ? "Beskrivende videotittel" : "Beskrivende bildetittel"} />
        </label>
        <label style={{ display: "grid", gap: ".35rem" }}>
          <span>{kind === "video" ? "Beskrivelse" : "Alternativ tekst"}</span>
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={kind === "video" ? "Kort videobeskrivelse" : "Hva viser bildet?"} />
        </label>
      </div>
      <input ref={fileInputRef} type="file" accept={uploadConfig.accept} hidden onChange={uploadMedia} />
      <p style={{ margin: ".75rem 0 0", opacity: .72 }}>
        {kind === "video" ? "MP4, MOV eller WebM. Maks 500 MB." : "JPG, PNG, WebP eller AVIF. Maks 10 MB."}
      </p>
      <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} style={{ marginTop: ".75rem" }}>
        {uploading ? "Laster opp..." : `Velg ${uploadConfig.label}`}
      </button>
      {message ? <p style={{ margin: ".75rem 0 0", opacity: .8 }} role="status">{message}</p> : null}
    </section>
  );
}
