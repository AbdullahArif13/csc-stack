/**
 * Faint "GS" logo watermark shown behind empty/idle page content,
 * matching the circular watermark seen throughout the Figma design.
 * The actual logo image lives in /public/gs-watermark.png.
 */
export default function Watermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <img
        src="/gs-watermark.png"
        alt=""
        className="h-[540px] w-[540px] select-none object-contain"
      />
    </div>
  );
}
