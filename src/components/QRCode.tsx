export function QRCode({ url, size = 160 }: { url: string; size?: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=1a1a2e&color=ffffff&format=svg`;
  return (
    <img src={qrUrl} alt="QR Code" width={size} height={size} className="rounded-lg" />
  );
}
