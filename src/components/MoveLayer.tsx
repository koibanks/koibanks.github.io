import { useEffect, useState } from 'react';
import { getDesign, getEditor, nudge, setEditor, updateDesign, useEditor } from '../lib/design';

interface Tag {
  id: string;
  label: string;
  x: number;
  y: number;
}

/**
 * "Move things" mode (dev only). While on: every movable piece is outlined and
 * labelled; drag to move, arrow keys to nudge (Shift = bigger steps), Esc to stop.
 * Links and buttons don't fire while you arrange.
 */
export function MoveLayer() {
  const { editing, selected } = useEditor();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (!editing) return;
    document.body.classList.add('is-moving');

    const pieceAt = (t: EventTarget | null) => {
      const el = (t as Element | null)?.closest?.('[data-edit]') as HTMLElement | null;
      if (!el || el.closest('.dpanel') || el.closest('[inert]')) return null;
      return el;
    };

    let drag: { id: string; sx: number; sy: number; x: number; y: number; s: number; r?: number } | null = null;

    const onDown = (e: PointerEvent) => {
      const el = pieceAt(e.target);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const id = el.dataset.edit!;
      const p = getDesign().positions[id] ?? { x: 0, y: 0, s: 1 };
      drag = { id, sx: e.clientX, sy: e.clientY, ...p };
      setEditor({ selected: id });
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const d = drag;
      const round = (n: number) => Math.round(n * 10) / 10;
      updateDesign((x) => {
        x.positions[d.id] = {
          ...x.positions[d.id],
          x: round(d.x + ((e.clientX - d.sx) / window.innerWidth) * 100),
          y: round(d.y + ((e.clientY - d.sy) / window.innerHeight) * 100),
          s: d.s,
        };
      });
    };
    const onUp = () => {
      drag = null;
    };
    // Swallow clicks on pieces so links don't open while arranging.
    const onClick = (e: MouseEvent) => {
      if (pieceAt(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element | null)?.closest?.('.dpanel input, .dpanel select')) return;
      if (e.key === 'Escape') {
        setEditor({ editing: false, selected: null });
        return;
      }
      const sel = getEditor().selected;
      if (!sel) return;
      const step = e.shiftKey ? 2.5 : 0.5;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const m = moves[e.key];
      if (!m) return;
      e.preventDefault();
      nudge(sel, m[0], m[1]);
    };

    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey);

    // Keep the labels pinned to their pieces.
    let raf = 0;
    const tick = () => {
      const next: Tag[] = [];
      document.querySelectorAll<HTMLElement>('[data-edit]').forEach((el) => {
        if (el.closest('[inert]') || el.closest('.dpanel')) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        // Big pieces get their tag just inside their top corner; small ones just above.
        const inside = r.height > 160;
        next.push({
          id: el.dataset.edit!,
          label: el.dataset.editLabel ?? el.dataset.edit!,
          x: r.left + (inside ? 10 : 0),
          y: inside ? Math.max(r.top, 64) + 30 : r.top,
        });
      });
      setTags((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      document.body.classList.remove('is-moving');
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
      setTags([]);
    };
  }, [editing]);

  // Outline the selected piece.
  useEffect(() => {
    document.querySelectorAll('.is-edit-selected').forEach((el) => el.classList.remove('is-edit-selected'));
    if (editing && selected) document.querySelector(`[data-edit="${selected}"]`)?.classList.add('is-edit-selected');
  });

  if (!editing) return null;
  return (
    <div className="move-tags" aria-hidden="true">
      {tags.map((t) => (
        <span
          key={t.id}
          className={`move-tag${t.id === selected ? ' is-selected' : ''}`}
          style={{ left: Math.max(4, t.x), top: Math.max(4, t.y - 22) }}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}
