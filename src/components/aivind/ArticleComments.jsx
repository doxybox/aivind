import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Send, SmilePlus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const COMMENT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🤔", "🎮", "🤖"];

function formatCommentDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ArticleComments({ articleSlug, onCountChange }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
  const textareaRef = useRef(null);

  const loadComments = useCallback(async () => {
    if (!articleSlug) return;

    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}/comments`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Kunne ikke hente kommentarer");

      const nextComments = Array.isArray(data.comments) ? data.comments : [];
      setComments(nextComments);
      onCountChange?.(Number(data.count) || nextComments.length);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Kunne ikke hente kommentarer");
    }
  }, [articleSlug, onCountChange]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitComment = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Kunne ikke publisere kommentaren");

      const nextComments = Array.isArray(data.comments) ? data.comments : [];
      setComments(nextComments);
      onCountChange?.(Number(data.count) || nextComments.length);
      setBody("");
      setStatus("ready");
      setMessage("Kommentaren er publisert.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Kunne ikke publisere kommentaren");
    }
  };

  const addEmoji = (emoji) => {
    setBody((currentBody) => `${currentBody}${emoji}`.slice(0, 2000));
    setIsEmojiMenuOpen(false);
    textareaRef.current?.focus();
  };

  return (
    <section className="mt-12 max-w-3xl border-t border-border pt-8" aria-labelledby="comments-heading">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/10 text-[#ff6a00]">
          <MessageCircle className="h-4 w-4" />
        </span>
        <div>
          <h2 id="comments-heading" className="text-2xl font-black tracking-tight text-foreground">Kommentarer</h2>
          <p className="text-sm text-muted-foreground">Saklig debatt hører hjemme her.</p>
        </div>
      </div>

      {isLoadingAuth ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Leser inn konto...</div>
      ) : isAuthenticated ? (
        <form className="mt-6" onSubmit={submitComment}>
          <label htmlFor="article-comment" className="sr-only">Skriv en kommentar</label>
          <textarea
            id="article-comment"
            ref={textareaRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Skriv en saklig kommentar..."
            disabled={status === "submitting"}
            className="w-full resize-y rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[#ff6a00] disabled:opacity-60"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEmojiMenuOpen((open) => !open)}
                disabled={status === "submitting"}
                aria-expanded={isEmojiMenuOpen}
                aria-controls="comment-emoji-menu"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:border-[#ff6a00]/60 hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SmilePlus className="h-4 w-4" /> Emoji
              </button>
              {isEmojiMenuOpen && (
                <div id="comment-emoji-menu" className="absolute bottom-full left-0 z-10 mb-2 grid w-64 grid-cols-5 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl" role="menu" aria-label="Velg emoji">
                  {COMMENT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      role="menuitem"
                      onClick={() => addEmoji(emoji)}
                      className="flex h-10 items-center justify-center rounded-lg text-xl transition-colors hover:bg-muted"
                      aria-label={`Legg til ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="ml-auto text-xs text-muted-foreground">{body.trim().length}/2000</span>
            <button type="submit" disabled={status === "submitting" || body.trim().length < 2} className="inline-flex items-center gap-2 rounded-lg bg-[#ff6a00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#ea5f00] disabled:cursor-not-allowed disabled:opacity-60">
              {status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publiser kommentar
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
          Du må <Link href={`/login?next=${encodeURIComponent(`/artikler/${articleSlug}`)}`} className="font-bold text-[#ff6a00] hover:underline">logge inn</Link> for å skrive en kommentar.
        </div>
      )}

      {message && <p className={`mt-4 text-sm ${status === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`} role="status">{message}</p>}

      <div className="mt-7 space-y-4">
        {status === "loading" && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Henter kommentarer...</div>}
        {status === "ready" && comments.length === 0 && <p className="text-sm text-muted-foreground">Ingen kommentarer ennå. Bli den første til å delta i samtalen.</p>}
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="font-bold text-foreground">{comment.authorName}</p>
              <time dateTime={comment.createdAt} className="shrink-0 text-xs text-muted-foreground">{formatCommentDate(comment.createdAt)}</time>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{comment.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
