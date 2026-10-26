# 日本語記事は yomiyasu lint を通す

`src/content` 配下の日本語記事（`en/` を除く .mdx）は、次の lint を終了コード 0 で通すこと。

`python -I .claude/skills/yomiyasu/scripts/yomiyasu_lint.py <mdx> --doc-type article --reader general --fail-on warn`

- `npm test` の `tests/unit/content/yomiyasuLint.test.ts` が強制する。
- 既存の 19 本は `tests/fixtures/yomiyasu-baseline.json` に内容のハッシュ付きで載せた例外。基準の記事を編集したら、lint を通して直し、`tests/fixtures/yomiyasu-baseline.json` から外す（編集するとハッシュが外れ、lint が必須になる。外し忘れると基準のハッシュ検査が失敗する）。
- 基準へ記事を追加してはならない（新規記事・編集した記事は lint を通して直す）。lint に通るようになった記事は基準から外す。
- 英語版（`src/content/en/`）は対象外。
