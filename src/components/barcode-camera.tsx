import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Loader2, X, Zap, ZapOff } from "lucide-react";

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export function BarcodeCamera({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not supported on this device/browser.");
        }
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result, _err, ctl) => {
            if (cancelled) return;
            if (result) {
              ctl.stop();
              onDetected(result.getText());
            }
          },
        );
        controlsRef.current = controls;
        if (cancelled) {
          controls.stop();
          return;
        }
        setReady(true);
        // Torch detection
        const stream = videoRef.current?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        const caps = track && "getCapabilities" in track ? (track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }) : undefined;
        if (caps && "torch" in caps) setTorchSupported(true);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Could not access camera";
        setError(
          msg.includes("Permission") || msg.includes("denied")
            ? "Camera permission denied. Enable it in your browser settings."
            : msg,
        );
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  async function toggleTorch() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} className="absolute inset-0 size-full object-cover" muted playsInline />

      {/* Scan frame overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] max-w-sm aspect-[4/3] rounded-3xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
          <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-primary rounded-full animate-pulse shadow-glow" />
        </div>
      </div>

      <div className="absolute top-0 inset-x-0 pt-[max(env(safe-area-inset-top),1rem)] px-4 flex items-center justify-between z-10">
        <button
          onClick={onClose}
          className="size-11 grid place-items-center rounded-full bg-black/60 text-white backdrop-blur"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        {torchSupported && (
          <button
            onClick={toggleTorch}
            className="size-11 grid place-items-center rounded-full bg-black/60 text-white backdrop-blur"
            aria-label="Toggle torch"
          >
            {torchOn ? <ZapOff className="size-5" /> : <Zap className="size-5" />}
          </button>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 pb-[max(env(safe-area-inset-bottom),1.5rem)] px-6 text-center text-white z-10">
        {error ? (
          <p className="bg-destructive/90 inline-block px-4 py-2 rounded-full text-sm">{error}</p>
        ) : !ready ? (
          <p className="inline-flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-sm">
            <Loader2 className="size-4 animate-spin" /> Starting camera…
          </p>
        ) : (
          <p className="bg-black/60 inline-block px-4 py-2 rounded-full text-sm">Center the barcode inside the frame</p>
        )}
      </div>
    </div>
  );
}
