# Spaceduck content flow

The blog uses a deliberate two-stage flow:

1. CLI notes are created in `content/drafts/`.
2. The draft is reviewed and redacted.
3. `npm run journal -- publish <draft-file>` moves the approved file to `content/posts/` and creates a Git commit.
4. Add `--push` to send that commit to the configured remote for Alf to consume.

Nothing is pushed unless `--push` is explicitly supplied. This keeps private
CLI activity, wallet information, credentials, and unfinished thinking out of
the public site.

## Commands

```text
npm run journal -- new --title "What I learned today" --lane notes
npm run journal -- list
npm run journal -- publish 2026-07-24-what-i-learned-today.md
npm run journal -- setup --remote https://github.com/you/spaceduck-content.git
npm run journal -- status
npm run journal -- publish 2026-07-24-what-i-learned-today.md --push
```

`setup` initializes the local repository and configures `origin`. Git
credentials are handled by Git itself; the CLI never stores a token. Alf can
then be connected to the repository and branch you push to.

## Video files

Add a video asset to the static site with:

```text
npm run journal -- media "C:\\path\\to\\test.MOV"
```

The command copies supported `.mp4`, `.webm`, `.ogg`, and `.mov` files into
`public/media/`. Reference the asset on its own line in a Markdown post:

```text
{{video:/media/test.MOV|Test movie}}
```

The blog build copies `public/media/` into the deployed output. Browser support
for MOV playback depends on the visitor's browser and codec; MP4 (H.264/AAC)
or WebM is the most portable choice.

## Cloudflare blog

The public journal is a separate static site at `blog.spaceduck.ing`. Build it
from approved posts and deploy it with Wrangler:

```text
npm run blog:build
npm run blog:deploy
```

The Cloudflare Pages project is `spaceduck-blog`. After the first deployment,
open Cloudflare Dashboard → Workers & Pages → `spaceduck-blog` → Custom
domains → Set up a custom domain, then enter `blog.spaceduck.ing`. Because the
domain is already in the same Cloudflare zone, Cloudflare can create the DNS
record and certificate there.
