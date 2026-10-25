/** slug を英小文字・数字・ハイフンだけに制限する（パス組み立て前の検証用） */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
