import { useEffect, useRef, useState } from 'react';
import { setEditor, updateDesign, useEditor } from '../lib/design';
import { ACCEPT, isVideo, uploadMedia } from '../lib/upload';

/** "cover:polished" → polished; "p.polished.report.3.1" → polished. */
const projectOf = (slot: string) => (slot.startsWith('cover:') ? slot.slice(6) : slot.split('.')[1]);

/** Put a new file into a slot: folder cover or a project-page image. */
function assign(slot: string, src: string) {
  updateDesign((d) => {
    if (slot.startsWith('cover:')) d.covers[slot.slice(6)] = src;
    else d.media[slot] = src;
  });
}

/**
 * Can this browser play the video? iPhone .mov files are often HEVC, which
 * Chrome and Firefox can't show. Resolves with a reason when it can't.
 */
function checkVideo(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'metadata';
    const done = (why: string | null) => {
      clearTimeout(t);
      v.removeAttribute('src');
      v.load();
      resolve(why);
    };
    const t = setTimeout(() => done('it took too long to load'), 10000);
    v.onloadeddata = () => done(v.videoWidth ? null : "only its sound loaded (the picture's format isn't supported)");
    v.onerror = () => done("this browser can't play its format");
    v.src = src;
  });
}

/**
 * "Edit images" mode (dev only). Every replaceable image or video gets an
 * outline: click it to pick a file, or drop a file straight onto it. The file is
 * saved into public/work/<project>/ and used right away (Save keeps it).
 */
export function MediaLayer() {
  const { imaging } = useEditor();
  const [status, setStatus] = useState<{ text: string; tone: 'info' | 'ok' | 'warn' } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<string | null>(null);
  const adding = useRef<string | null>(null); // carousel slot we're adding photos to
  const many = useRef<HTMLInputElement>(null);

  const replace = async (slot: string, file: File) => {
    setStatus({ text: `Uploading ${file.name}…`, tone: 'info' });
    try {
      const { src, note } = await uploadMedia(projectOf(slot), file);
      if (isVideo(src)) {
        setStatus({ text: 'Checking the video plays…', tone: 'info' });
        const why = await checkVideo(src);
        if (why) {
          setStatus({
            text: `Saved, but ${why}. Export it as an H.264 .mp4 (on iPhone: Settings → Camera → Formats → Most Compatible; or export from QuickTime/Premiere) and drop that in instead.`,
            tone: 'warn',
          });
          assign(slot, src);
          return;
        }
      }
      assign(slot, src);
      setStatus({ text: `Replaced${note ? ` (${note})` : ''}. Save to keep it.`, tone: 'ok' });
    } catch (e) {
      setStatus({ text: `Couldn't upload: ${(e as Error).message}`, tone: 'warn' });
    }
  };
  /** Add photos to a carousel (in order), uploading each. */
  const add = async (slot: string, files: File[]) => {
    const srcs: string[] = [];
    for (const [i, file] of files.entries()) {
      setStatus({ text: `Uploading ${i + 1} of ${files.length}…`, tone: 'info' });
      try {
        srcs.push((await uploadMedia(projectOf(slot), file)).src);
      } catch (e) {
        setStatus({ text: `Couldn't upload ${file.name}: ${(e as Error).message}`, tone: 'warn' });
      }
    }
    if (!srcs.length) return;
    updateDesign((d) => void (d.lists[slot] = [...(d.lists[slot] ?? []), ...srcs]));
    setStatus({ text: `Added ${srcs.length} photo${srcs.length > 1 ? 's' : ''}. Save to keep them.`, tone: 'ok' });
  };
  const addRef = useRef(add);
  addRef.current = add;
  const replaceRef = useRef(replace);
  replaceRef.current = replace;

  useEffect(() => {
    if (!imaging) {
      setStatus(null);
      return;
    }
    document.body.classList.add('is-imaging');
    setStatus({ text: 'Click an outlined image to replace it, or drop a file on it. Esc when done.', tone: 'info' });

    const slotAt = (x: number, y: number) =>
      (document.elementsFromPoint(x, y).find((el) => el instanceof HTMLElement && el.dataset.slot && !el.closest('[inert]')) as
        | HTMLElement
        | undefined) ?? null;

    let hot: HTMLElement | null = null;
    const heat = (el: HTMLElement | null) => {
      if (hot === el) return;
      hot?.classList.remove('is-drop');
      hot = el;
      hot?.classList.add('is-drop');
    };

    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest('.dpanel, .dp-media-status')) return;
      const addBtn = (e.target as Element).closest<HTMLElement>('[data-slot-add]');
      const removeBtn = (e.target as Element).closest<HTMLElement>('[data-slot-remove]');
      const rotateBtn = (e.target as Element).closest<HTMLElement>('[data-slot-rotate]');
      if (rotateBtn) {
        e.preventDefault();
        e.stopPropagation();
        const file = rotateBtn.dataset.slotRotate!;
        updateDesign((d) => {
          const next = ((d.rotate[file] ?? 0) + 90) % 360;
          if (next) d.rotate[file] = next;
          else delete d.rotate[file];
        });
        setStatus({ text: 'Rotated. Save to keep it.', tone: 'ok' });
        return;
      }
      if (addBtn || removeBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (addBtn) {
          adding.current = addBtn.dataset.slotAdd!;
          many.current?.click();
        } else {
          const [slot, k] = removeBtn!.dataset.slotRemove!.split('|');
          updateDesign((d) => void (d.lists[slot] = (d.lists[slot] ?? []).filter((_, i) => i !== Number(k))));
          setStatus({ text: 'Photo removed (the file stays in public/work). Save to keep it.', tone: 'ok' });
        }
        return;
      }
      const el = slotAt(e.clientX, e.clientY);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      target.current = el.dataset.slot!;
      input.current?.click();
    };
    // A carousel (photo essay) under the pointer: dropping there adds photos instead of replacing one.
    const listAt = (x: number, y: number) => {
      const host = document
        .elementsFromPoint(x, y)
        .map((el) => el.closest('.hv-essay'))
        .find(Boolean);
      return (host?.querySelector<HTMLElement>('[data-slot-add]')?.dataset.slotAdd ?? null) as string | null;
    };
    let hotList: Element | null = null;
    const heatList = (el: Element | null) => {
      if (hotList === el) return;
      hotList?.classList.remove('is-drop-add');
      hotList = el;
      hotList?.classList.add('is-drop-add');
    };
    const onOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      if (listAt(e.clientX, e.clientY)) {
        heat(null);
        heatList(document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest('.hv-essay')).find(Boolean) ?? null);
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        return;
      }
      heatList(null);
      const el = slotAt(e.clientX, e.clientY);
      heat(el);
      if (el) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    const onDrop = (e: DragEvent) => {
      const list = listAt(e.clientX, e.clientY);
      heatList(null);
      if (list && e.dataTransfer?.files.length) {
        e.preventDefault();
        heat(null);
        void addRef.current(list, [...e.dataTransfer.files]);
        return;
      }
      const el = slotAt(e.clientX, e.clientY);
      heat(null);
      const file = e.dataTransfer?.files[0];
      if (!el || !file) return;
      e.preventDefault();
      void replaceRef.current(el.dataset.slot!, file);
    };
    const onLeave = (e: DragEvent) => {
      if (!e.relatedTarget) (heat(null), heatList(null));
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditor({ imaging: false });
    };

    window.addEventListener('click', onClick, true);
    window.addEventListener('dragover', onOver);
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.classList.remove('is-imaging');
      heat(null);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('keydown', onEsc);
    };
  }, [imaging]);

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file && target.current) void replace(target.current, file);
        }}
      />
      <input
        ref={many}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          if (files.length && adding.current) void add(adding.current, files);
        }}
      />
      {status && (
        <div className={`dp-media-status is-${status.tone}`} role="status">
          {status.text}
        </div>
      )}
    </>
  );
}
