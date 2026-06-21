"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDrop } from "@/lib/drop-actions";

const CATEGORIES = ["wellness", "fitness", "food", "health", "travel", "learning", "culture", "telecom"];
const inputCls = "w-full rounded-[18px] border-[1.5px] border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-coral";

// Resize an uploaded image client-side to a compact JPEG data-URI (no object storage needed).
function fileToDataUri(file: File, maxDim = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width >= height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
      else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

export function DropForm({ defaultCategory }: { defaultCategory: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setImageUrl(await fileToDataUri(file)); } catch { setError("Couldn't read that image."); }
  }

  function submit(formData: FormData) {
    setError(null);
    const input = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      area: formData.get("area"),
      imageUrl: imageUrl || undefined,
      costCoins: formData.get("costCoins"),
      totalSlots: formData.get("totalSlots"),
      hours: formData.get("hours"),
    };
    startTransition(async () => {
      const res = await createDrop(input);
      if (res.error) setError(res.error);
      else {
        setImageUrl("");
        if (fileRef.current) fileRef.current.value = "";
        (document.getElementById("dropform") as HTMLFormElement)?.reset();
        router.refresh();
      }
    });
  }

  return (
    <form id="dropform" action={submit} className="space-y-3">
      <input name="title" placeholder="Flash: free smoothie with any class" required className={inputCls} />
      <input name="description" placeholder="Short description (optional)" className={inputCls} />

      {/* image upload */}
      <div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        {imageUrl ? (
          <div className="relative overflow-hidden rounded-[18px] border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Drop preview" className="h-36 w-full object-cover" />
            <button type="button" onClick={() => { setImageUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute right-2 top-2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">Remove</button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} className={`${inputCls} flex items-center justify-center gap-2 border-dashed text-muted`}>
            + Add a photo for this drop
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <select name="category" defaultValue={defaultCategory} className={`min-w-0 flex-1 ${inputCls}`}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input name="area" placeholder="Area" className={`w-28 ${inputCls}`} />
      </div>
      <div className="flex gap-2">
        <label className="field mb-0 flex-1"><span className="kicker mb-1.5 block">Cost (coins)</span>
          <input name="costCoins" type="number" min={1} defaultValue={50} required />
        </label>
        <label className="field mb-0 flex-1"><span className="kicker mb-1.5 block">Slots</span>
          <input name="totalSlots" type="number" min={1} defaultValue={10} required />
        </label>
        <label className="field mb-0 flex-1"><span className="kicker mb-1.5 block">Ends in (h)</span>
          <input name="hours" type="number" min={1} defaultValue={48} required />
        </label>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary btn-lg disabled:opacity-60">
        {pending ? "Posting…" : "Post drop"}
      </button>
      {error && <p className="text-sm font-medium text-coral">{error}</p>}
    </form>
  );
}
