import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Clipboard, Image as ImageIcon, RefreshCw, Upload, Video } from "lucide-react";
import { redirectForAuthError, requireAnyRole } from "@/lib/server/auth-helpers";
import { getCloudflareMediaStatus } from "@/lib/server/cloudflare-media";

const STAFF_ROLES = ["journalist", "editor", "admin"];
const IMAGE_UPLOAD_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
};
const VIDEO_UPLOAD_LIMITS = {
  maxBytes: 500 * 1024 * 1024,
  allowedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
};

const emptyImageForm = {
  title: "",
  alt: "",
  caption: "",
  credit: "",
  originalFilename: "",
};

const emptyVideoForm = {
  title: "",
  description: "",
  originalFilename: "",
  createReel: false,
  reelSlug: "",
};

export async function getServerSideProps({ req }) {
  try {
    const { session, roles } = await requireAnyRole(req, STAFF_ROLES);
    return {
      props: {
        user: {
          name: session.user.name || session.user.email || "Redaksjon",
          email: session.user.email || "",
        },
        roles,
        mediaStatus: {
          images: getCloudflareMediaStatus("images"),
          stream: getCloudflareMediaStatus("stream"),
        },
      },
    };
  } catch (error) {
    return redirectForAuthError(error);
  }
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function statusClass(status) {
  if (status === "ready") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "failed") return "border-red-400/30 bg-red-400/10 text-red-200";
  if (status === "processing") return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  return "border-orange-400/30 bg-orange-400/10 text-orange-200";
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

function validateSelectedFile(file, limits, label) {
  if (!file) {
    return `Velg en ${label}fil forst.`;
  }

  if (!limits.allowedMimeTypes.includes(file.type)) {
    return `${label}filen maa vaere ${limits.allowedMimeTypes.join(", ")}.`;
  }

  if (file.size > limits.maxBytes) {
    return `${label}filen er for stor. Maks ${formatBytes(limits.maxBytes)}.`;
  }

  return "";
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Noe gikk galt.");
  }
  return data;
}

function TextInput({ label, value, onChange, placeholder, required = false }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">{label}</span>
      <input
        className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#ff6a00]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">{label}</span>
      <textarea
        className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#ff6a00]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function MediaCard({ item, onRefresh, copiedId, onCopy, busy = false }) {
  const providerId = item.cloudflareImageId || item.cloudflareStreamUid || "";
  const url = item.deliveryUrl || item.thumbnailUrl || "";

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex gap-4">
        <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {item.thumbnailUrl ? (
            <Image src={item.thumbnailUrl} alt="" width={96} height={80} unoptimized className="h-full w-full object-cover" />
          ) : item.type === "video" ? (
            <Video className="h-6 w-6 text-zinc-500" />
          ) : (
            <ImageIcon className="h-6 w-6 text-zinc-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-white">{item.title || "Uten tittel"}</h3>
            <span className={classNames("rounded-full border px-2 py-0.5 text-[11px] font-bold", statusClass(item.status))}>
              {item.status || "ukjent"}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">{item.type} · {item.provider}</p>
          <div className="mt-2 space-y-1 font-mono text-[11px] text-zinc-500">
            <p className="truncate">Payload: {item.id}</p>
            {providerId && <p className="truncate">Cloudflare: {providerId}</p>}
          </div>
          {(url || providerId) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {url && (
                <button
                  type="button"
                  onClick={() => onCopy(item.id, url)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
                >
                  {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                  Kopier URL
                </button>
              )}
              {providerId && (
                <button
                  type="button"
                  onClick={() => onRefresh(item)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:border-[#ff6a00] hover:text-[#ff6a00] disabled:opacity-60"
                >
                  <RefreshCw className={classNames("h-3.5 w-3.5", busy && "animate-spin")} />
                  {busy ? "Sjekker ..." : "Sjekk status"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function StaffMediaPage({ user, roles, mediaStatus }) {
  const [imageForm, setImageForm] = useState(emptyImageForm);
  const [videoForm, setVideoForm] = useState(emptyVideoForm);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [busy, setBusy] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const roleLabel = useMemo(() => roles?.join(", ") || "staff", [roles]);
  const imagesEnabled = mediaStatus?.images?.enabled === true;
  const streamEnabled = mediaStatus?.stream?.enabled === true;

  async function loadMediaAssets() {
    setLoadingList(true);
    setError("");
    try {
      const data = await readJson(await fetch("/api/staff/media-assets?limit=24"));
      setMediaAssets(data.mediaAssets || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadMediaAssets();
  }, []);

  async function refreshMediaAsset(item) {
    const providerId = item.cloudflareImageId || item.cloudflareStreamUid;
    if (!providerId) return;

    setBusy(`refresh-${item.id}`);
    setError("");
    try {
      const endpoint = item.type === "video"
        ? `/api/cloudflare/stream/${encodeURIComponent(providerId)}`
        : `/api/cloudflare/images/${encodeURIComponent(providerId)}`;
      await readJson(await fetch(endpoint));
      await loadMediaAssets();
      setStatus("Status oppdatert.");
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setBusy("");
    }
  }

  async function copyUrl(id, url) {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1600);
  }

  async function uploadImage(event) {
    event.preventDefault();
    if (!imagesEnabled) {
      setError(mediaStatus?.images?.message || "Cloudflare Images er ikke aktivert enna.");
      return;
    }
    const fileError = validateSelectedFile(imageFile, IMAGE_UPLOAD_LIMITS, "bilde");
    if (fileError) {
      setError(fileError);
      return;
    }

    setBusy("image");
    setError("");
    setStatus("Klargjør bildeopplasting ...");

    try {
      const metadata = {
        ...imageForm,
        title: imageForm.title || imageFile.name,
        originalFilename: imageForm.originalFilename || imageFile.name,
        fileMimeType: imageFile.type,
        fileSizeBytes: imageFile.size,
      };
      const directUpload = await readJson(await fetch("/api/cloudflare/images/direct-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      }));
      const formData = new FormData();
      formData.append("file", imageFile);
      setStatus("Laster bildet direkte til Cloudflare ...");
      await readJson(await fetch(directUpload.uploadURL, {
        method: "POST",
        body: formData,
      }));
      setStatus("Bildet er lastet opp. Henter status ...");
      await readJson(await fetch(`/api/cloudflare/images/${encodeURIComponent(directUpload.cloudflareImageId)}`));
      setImageForm(emptyImageForm);
      setImageFile(null);
      event.currentTarget.reset();
      await loadMediaAssets();
      setStatus("Bilde opplastet og lagret i Payload media-assets.");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy("");
    }
  }

  async function uploadVideo(event) {
    event.preventDefault();
    if (!streamEnabled) {
      setError(mediaStatus?.stream?.message || "Cloudflare Stream er ikke aktivert enna.");
      return;
    }
    const fileError = validateSelectedFile(videoFile, VIDEO_UPLOAD_LIMITS, "video");
    if (fileError) {
      setError(fileError);
      return;
    }

    setBusy("video");
    setError("");
    setStatus("Klargjør videoopplasting ...");

    try {
      const metadata = {
        ...videoForm,
        title: videoForm.title || videoFile.name,
        originalFilename: videoForm.originalFilename || videoFile.name,
        reelSlug: videoForm.reelSlug || undefined,
        fileMimeType: videoFile.type,
        fileSizeBytes: videoFile.size,
      };
      const directUpload = await readJson(await fetch("/api/cloudflare/stream/direct-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      }));

      setStatus("Laster video direkte til Cloudflare Stream ...");
      const uploadResponse = await fetch(directUpload.uploadURL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/offset+octet-stream",
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": "0",
        },
        body: videoFile,
      });
      if (!uploadResponse.ok) {
        throw new Error("Cloudflare Stream-opplasting feilet.");
      }

      setStatus("Videoen behandles hos Cloudflare. Henter status ...");
      await readJson(await fetch(`/api/cloudflare/stream/${encodeURIComponent(directUpload.cloudflareStreamUid)}`));
      setVideoForm(emptyVideoForm);
      setVideoFile(null);
      event.currentTarget.reset();
      await loadMediaAssets();
      setStatus("Video opplastet og lagret i Payload media-assets.");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-[#11161d] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
          <div>
            <Link href="/redaksjon" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-[#ff6a00]">
              <ArrowLeft className="h-4 w-4" />
              Redaksjonsoversikt
            </Link>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff6a00]">Redaksjon</p>
            <h1 className="mt-2 text-3xl font-black">Mediaopplasting</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Cloudflare mediaopplasting er parkert til kunden aktiverer nodvendige kvoter og konfigurasjon.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <p className="font-bold">{user.name}</p>
            <p className="text-xs text-zinc-400">{user.email} · {roleLabel}</p>
          </div>
        </header>

        {(status || error) && (
          <div className={classNames(
            "mb-6 rounded-xl border px-4 py-3 text-sm font-semibold",
            error ? "border-red-400/30 bg-red-400/10 text-red-100" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
          )}>
            {error || status}
          </div>
        )}

        {(!imagesEnabled || !streamEnabled) && (
          <div className="mb-6 rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
            Cloudflare-opplasting er ikke aktivert enna. Eksisterende media-assets kan vises, men nye opplastinger er stoppet trygt.
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={uploadImage} className="rounded-2xl border border-white/10 bg-[#0b1016] p-5 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6a00]/15 text-[#ff6a00]">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Bilde</h2>
                <p className="text-sm text-zinc-400">{imagesEnabled ? "Cloudflare Images + Payload media-assets" : "Bildeopplasting er ikke aktivert enna"}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <TextInput label="Tittel" value={imageForm.title} onChange={(title) => setImageForm((form) => ({ ...form, title }))} placeholder="Forsidebilde til AI-sak" />
              <TextInput label="Alt-tekst" value={imageForm.alt} onChange={(alt) => setImageForm((form) => ({ ...form, alt }))} placeholder="Kort beskrivelse av bildet" />
              <TextArea label="Bildetekst" value={imageForm.caption} onChange={(caption) => setImageForm((form) => ({ ...form, caption }))} placeholder="Valgfri bildetekst" />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Kreditering" value={imageForm.credit} onChange={(credit) => setImageForm((form) => ({ ...form, credit }))} placeholder="Foto: TEKKNO" />
                <TextInput label="Filnavn" value={imageForm.originalFilename} onChange={(originalFilename) => setImageForm((form) => ({ ...form, originalFilename }))} placeholder="Bruker valgt filnavn som fallback" />
              </div>
              <input
                type="file"
                accept={IMAGE_UPLOAD_LIMITS.allowedMimeTypes.join(",")}
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#ff6a00] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
              />
              <p className="text-xs text-zinc-500">JPEG, PNG, WebP eller AVIF. Maks {formatBytes(IMAGE_UPLOAD_LIMITS.maxBytes)}.</p>
              <button
                type="submit"
                disabled={busy === "image" || !imagesEnabled}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff6a00] px-4 py-3 text-sm font-black text-white transition hover:bg-[#ff7f24] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {busy === "image" ? "Laster opp ..." : "Last opp bilde"}
              </button>
            </div>
          </form>

          <form onSubmit={uploadVideo} className="rounded-2xl border border-white/10 bg-[#0b1016] p-5 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6a00]/15 text-[#ff6a00]">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Video</h2>
                <p className="text-sm text-zinc-400">{streamEnabled ? "Cloudflare Stream + valgfri Payload reel" : "Videoopplasting er ikke aktivert enna"}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <TextInput label="Tittel" value={videoForm.title} onChange={(title) => setVideoForm((form) => ({ ...form, title }))} placeholder="Kort reel om ny AI-modell" />
              <TextArea label="Beskrivelse" value={videoForm.description} onChange={(description) => setVideoForm((form) => ({ ...form, description }))} placeholder="Valgfri intern/ekstern beskrivelse" />
              <TextInput label="Filnavn" value={videoForm.originalFilename} onChange={(originalFilename) => setVideoForm((form) => ({ ...form, originalFilename }))} placeholder="Bruker valgt filnavn som fallback" />
              <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-zinc-200">
                <input
                  type="checkbox"
                  checked={videoForm.createReel}
                  onChange={(event) => setVideoForm((form) => ({ ...form, createReel: event.target.checked }))}
                  className="h-4 w-4 accent-[#ff6a00]"
                />
                Opprett draft reel i Payload
              </label>
              {videoForm.createReel && (
                <TextInput label="Reel slug" value={videoForm.reelSlug} onChange={(reelSlug) => setVideoForm((form) => ({ ...form, reelSlug }))} placeholder="la-sta-tomt-for-auto-slug" />
              )}
              <input
                type="file"
                accept={VIDEO_UPLOAD_LIMITS.allowedMimeTypes.join(",")}
                onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#ff6a00] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
              />
              <p className="text-xs text-zinc-500">MP4, MOV eller WebM. Maks {formatBytes(VIDEO_UPLOAD_LIMITS.maxBytes)}.</p>
              <button
                type="submit"
                disabled={busy === "video" || !streamEnabled}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff6a00] px-4 py-3 text-sm font-black text-white transition hover:bg-[#ff7f24] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {busy === "video" ? "Laster opp ..." : "Last opp video"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#0b1016] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Siste media-assets</h2>
              <p className="text-sm text-zinc-400">Trygge felter fra Payload, uten intern metadata eller tokens.</p>
            </div>
            <button
              type="button"
              onClick={loadMediaAssets}
              disabled={loadingList}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-white transition hover:border-[#ff6a00] hover:text-[#ff6a00] disabled:opacity-60"
            >
              <RefreshCw className={classNames("h-4 w-4", loadingList && "animate-spin")} />
              Oppdater
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {mediaAssets.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                copiedId={copiedId}
                onCopy={copyUrl}
                onRefresh={refreshMediaAsset}
                busy={busy === `refresh-${item.id}`}
              />
            ))}
          </div>

          {!loadingList && mediaAssets.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-400">
              Ingen media-assets funnet ennå.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
