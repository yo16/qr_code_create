import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** 許可する要素（生HTMLは rehype-raw を使わないためそもそも解釈されない。画像は不許可） */
const ALLOWED_ELEMENTS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "del",
  "ul",
  "ol",
  "li",
  "a",
  "code",
  "pre",
  "blockquote",
  "hr",
  "br",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];

const SAFE_PREFIX = /^(https?:\/\/|mailto:)/i;
const FORBIDDEN_CHARS = /[\u0000-\u001F\u007F\s]|%0[9ad]/i;

/**
 * 印刷用ポスターでは相対リンクに意味がないため、許可を絞る。
 * 前後の空白を除いたうえで、制御文字・空白・改行/タブのエンコードを含む URL は拒否し、
 * http:// https:// mailto: で始まるものだけを base なしで解釈する。
 * 相対パス・#anchor・//host・スキームなしは空文字（リンク無効化）になる。
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (FORBIDDEN_CHARS.test(trimmed) || !SAFE_PREFIX.test(trimmed)) return "";
  try {
    const parsed = new URL(trimmed);
    if (SAFE_PROTOCOLS.includes(parsed.protocol)) return url;
  } catch {
    // 解釈できない URL は無効扱い
  }
  return "";
}

interface MarkdownRendererProps {
  source: string;
}

export function MarkdownRenderer({ source }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      allowedElements={ALLOWED_ELEMENTS}
      unwrapDisallowed
      urlTransform={sanitizeUrl}
      components={{
        a: ({ node, href, children }) => {
          void node;
          return href ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ) : (
            <span>{children}</span>
          );
        },
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
