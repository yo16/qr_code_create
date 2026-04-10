interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export function buildUtmUrl(baseUrl: string, utm: UtmParams): string {
  if (!baseUrl) {
    return "";
  }

  let urlObj: URL;
  try {
    urlObj = new URL(baseUrl);
  } catch {
    return baseUrl;
  }

  const paramMap: [string, string | undefined][] = [
    ["utm_source", utm.source],
    ["utm_medium", utm.medium],
    ["utm_campaign", utm.campaign],
    ["utm_term", utm.term],
    ["utm_content", utm.content],
  ];

  for (const [key, value] of paramMap) {
    if (value && value.trim() !== "") {
      urlObj.searchParams.set(key, value.trim());
    }
  }

  return urlObj.toString();
}
