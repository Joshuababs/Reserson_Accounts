/** Ported from the merchant dashboard's components/core/spinner.vue. */
export function Spinner({ size = 48, color = "#575bc7" }: { size?: number; color?: string }) {
  const borderWidth = Math.max(2, Math.round(size / 10));
  return (
    <div
      className="rounded-full animate-spin shrink-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        borderColor: `${color}33`,
        borderTopColor: color,
      }}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}
