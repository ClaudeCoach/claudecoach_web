export type ShareImageResult = "clipboard" | "downloaded" | "failed";

async function elementToBlob(elementId: string): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, {
    backgroundColor: "#050813",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  return await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
}

function fallbackDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function openTwitterPopup(text: string) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}`;
  const w = 600;
  const h = 700;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  window.open(
    url,
    "claudecoach-share",
    `popup=yes,width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`
  );
}

export async function prepareShareImage(
  elementId: string,
  filename: string
): Promise<ShareImageResult> {
  const blob = await elementToBlob(elementId);
  if (!blob) return "failed";

  // 1. Clipboard image (user pastes with Ctrl+V in the X popup)
  try {
    const ClipboardItemCtor = (window as unknown as {
      ClipboardItem?: typeof ClipboardItem;
    }).ClipboardItem;
    if (ClipboardItemCtor && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItemCtor({ "image/png": blob }),
      ]);
      return "clipboard";
    }
  } catch {
    // fall through
  }

  // 2. Fallback: download PNG (user attaches manually)
  fallbackDownload(blob, filename);
  return "downloaded";
}
