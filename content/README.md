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
