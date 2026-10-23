type BrandMarkProps = {
  className?: string;
};

/**
 * サービスマーク。QR のファインダーパターン（回）の右下の角を 1 マス外に置いた形。
 * 元データは public/brand/mark.svg（パスは同じ）。色は CSS の color で決める。
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width="24"
      height="24"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 0h28v4H0zM0 4h4v24H0zM24 4h4v20h-4zM4 24h20v4H4zM8 8h12v12H8zM28 28h4v4h-4z" />
    </svg>
  );
}
