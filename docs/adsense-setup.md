# Google AdSense Setup

TEKKNO has reserved ad placements in the public frontend, but AdSense is disabled by default. The frontend must remain disabled until the full checklist below is complete.

## Before enabling ads

1. Create or use the TEKKNO Google AdSense publisher account and add `tekkno.no` as a site.
2. Complete Google's site review and any payment, tax, and identity steps in AdSense.
3. Configure a Google-certified CMP for EEA traffic and update the privacy policy to describe advertising and consent choices.
4. Create one display ad unit for each placement:
   - homepage primary (`970 x 250` responsive)
   - homepage secondary (`970 x 250` responsive)
   - category bottom (`970 x 250` responsive)
   - article sidebar top (`300 x 600`)
   - article sidebar bottom (`300 x 250`)
5. Add the exact `ads.txt` line supplied by AdSense to `public/ads.txt`, then verify it is reachable at `https://tekkno.no/ads.txt`.

## Payload Admin

After the prerequisites are complete, use **Globals -> Annonseinnstillinger** in Payload Admin:

1. Add the public `ca-pub-...` publisher ID.
2. Add the numeric AdSense slot ID for each placement you have created.
3. Save while **Aktiver Google AdSense** remains off.
4. Verify the production `ads.txt` file and CMP.
5. Turn on **Aktiver Google AdSense**, then refresh a public page.

Only users with the `ad_manager`, `editor`, or `admin` Payload role can change this Global. The public frontend receives only the enabled flag, publisher ID, and configured slot IDs.

Publisher and slot IDs are public identifiers, not server secrets. They are stored in Payload because the public page must receive them to load a display ad. Keep the account login, payment details, and unrelated Google credentials private.

## Verification

- Deploy the Payload Global and public app only to the approved production domain.
- Confirm each placement reserves its expected space on desktop and mobile.
- Confirm `https://tekkno.no/ads.txt` returns HTTP 200 and exactly matches the line in AdSense.
- Do not click your own live ads or repeatedly refresh pages to test them.
- Turn off **Aktiver Google AdSense** in Payload to stop delivery without removing layouts or editorial direct-ad capabilities. If the settings route cannot reach Payload, ads remain disabled by design.
