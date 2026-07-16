# Profile and author images

## Reader profile images

Authenticated readers can upload a JPG, PNG, WebP, or AVIF image up to 2 MB from **Min side > Profil**. The browser uploads directly to Cloudflare Images using a short-lived URL issued by `POST /api/account/avatar/direct-upload`.

- The API derives the account from the Better Auth session; it never accepts a client-provided user ID.
- The endpoint is rate limited and only stores the resulting Cloudflare delivery URL in `user_profile.avatar_url`.
- Reader avatars are not created as Payload `media-assets`, keeping private account data separate from editorial media.

## Editorial media and author images

Journalists can upload editorial images directly in Payload Admin under **Media assets**. The image is sent directly to Cloudflare Images and a `media-assets` record is created automatically. Payload `authors.profileImage` is required, so upload/select an editorial image before using an author in a published article.
