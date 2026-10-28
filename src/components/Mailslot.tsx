import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSite } from '../lib/text';

/** The little mail slot under "about": click it to write or draw a note. */
export function MailslotIcon({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="hd-mailslot" onClick={onOpen} aria-label="Leave me a note" title="leave a note">
      <svg viewBox="0 0 32 20" aria-hidden="true">
        {/* the plate */}
        <rect x="1" y="1" width="30" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        {/* the flap, which lifts on hover */}
        <g className="hd-mailslot-flap">
          <rect x="6" y="7" width="20" height="5" rx="2.5" fill="currentColor" />
        </g>
        <rect x="6" y="9" width="20" height="2" rx="1" fill="#000" opacity="0.55" />
      </svg>
    </button>
  );
}

const COLORS = ['#111111', '#e3202a', '#2b59ff', '#2f8a3c', '#ffc400', '#ff5a2c'];
const SIZES = [3, 8, 18];
const CANVAS_W = 640;
const CANVAS_H = 300;

/**
 * The note: write something, draw something (or both), and slip it through.
 * Notes are delivered to your inbox by FormSubmit (no account needed; the very
 * first one sends you a confirmation email to click).
 */
export function MailslotPanel({ onClose }: { onClose: () => void }) {
  const site = getSite();
  const to = site.email;
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLFormElement>(null);
  const first = useRef<HTMLTextAreaElement>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [erasing, setErasing] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'writing' | 'sending' | 'sent' | 'error'>('writing');
  const history = useRef<ImageData[]>([]);

  // Paper-white canvas, focus the message box, Esc closes.
  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!;
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.documentElement.style.overflow = prev;
    };
  }, [onClose]);

  // Drawing: pointer events work for mouse, pen and touch alike.
  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    let last: { x: number; y: number } | null = null;
    const at = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * CANVAS_W, y: ((e.clientY - r.top) / r.height) * CANVAS_H };
    };
    const dot = (p: { x: number; y: number }) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    };
    const style = () => {
      ctx.strokeStyle = ctx.fillStyle = erasing ? '#fffdf7' : color;
      ctx.lineWidth = erasing ? size * 2 : size;
      ctx.lineCap = ctx.lineJoin = 'round';
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      c.setPointerCapture(e.pointerId);
      history.current.push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
      if (history.current.length > 30) history.current.shift();
      style();
      last = at(e);
      dot(last);
      setDrawn(true);
    };
    const move = (e: PointerEvent) => {
      if (!last) return;
      const p = at(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    };
    const up = () => (last = null);
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    return () => {
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up);
      c.removeEventListener('pointercancel', up);
    };
  }, [color, size, erasing]);

  const undo = () => {
    const prev = history.current.pop();
    if (prev) canvas.current!.getContext('2d')!.putImageData(prev, 0, 0);
    if (!history.current.length) setDrawn(false);
  };
  const clear = () => {
    const ctx = canvas.current!.getContext('2d')!;
    history.current.push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    setDrawn(false);
  };

  // Send: a normal form post (so the drawing can ride along as a picture),
  // into a hidden frame so the visitor stays on the page.
  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!message.trim() && !drawn) return;
    setState('sending');
    const file = form.elements.namedItem('attachment') as HTMLInputElement;
    if (drawn) {
      const blob = await new Promise<Blob | null>((r) => canvas.current!.toBlob(r, 'image/png'));
      if (blob) {
        const dt = new DataTransfer();
        dt.items.add(new File([blob], 'drawing.png', { type: 'image/png' }));
        file.files = dt.files;
      }
    } else file.value = '';
    const frame = document.querySelector<HTMLIFrameElement>('iframe[name="mailslot-sink"]')!;
    const done = () => {
      clearTimeout(fail);
      setState('sent');
    };
    const fail = window.setTimeout(() => {
      frame.removeEventListener('load', done);
      setState('error');
    }, 20000);
    frame.addEventListener('load', done, { once: true });
    form.submit();
  };

  const empty = !message.trim() && !drawn;
  return createPortal(
    <div className="mailslot" role="dialog" aria-modal="true" aria-labelledby="mailslot-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <iframe name="mailslot-sink" title="sending" hidden />
      <form
        ref={card}
        className={`mailslot-card is-${state}`}
        action={`https://formsubmit.co/${to}`}
        method="POST"
        encType="multipart/form-data"
        target="mailslot-sink"
        onSubmit={send}
      >
        <button type="button" className="mailslot-x" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {state === 'sent' ? (
          <div className="mailslot-thanks" role="status">
            <p className="mailslot-k">delivered</p>
            <p className="mailslot-big">thank you :]</p>
            <p>your note went through the slot.</p>
            <button type="button" className="mailslot-send" onClick={onClose}>
              close
            </button>
          </div>
        ) : (
          <>
            <p className="mailslot-k">mail slot</p>
            <h2 id="mailslot-title" className="mailslot-big">
              leave me a note
            </h2>
            <label className="mailslot-field">
              <span>write something</span>
              <textarea ref={first} name="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="hi koi…" />
            </label>
            <div className="mailslot-field">
              <span id="mailslot-draw">or draw me something</span>
              <div className="mailslot-tools" role="toolbar" aria-labelledby="mailslot-draw">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`mailslot-swatch${!erasing && color === c ? ' is-on' : ''}`}
                    style={{ background: c }}
                    aria-label={`Colour ${c}`}
                    aria-pressed={!erasing && color === c}
                    onClick={() => (setColor(c), setErasing(false))}
                  />
                ))}
                <span className="mailslot-sep" />
                {SIZES.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    className={`mailslot-size${size === s ? ' is-on' : ''}`}
                    aria-label={['Thin', 'Medium', 'Thick'][i] + ' brush'}
                    aria-pressed={size === s}
                    onClick={() => setSize(s)}
                  >
                    <span style={{ width: 4 + i * 5, height: 4 + i * 5 }} />
                  </button>
                ))}
                <span className="mailslot-sep" />
                <button type="button" className={`mailslot-tool${erasing ? ' is-on' : ''}`} aria-pressed={erasing} onClick={() => setErasing((v) => !v)}>
                  eraser
                </button>
                <button type="button" className="mailslot-tool" onClick={undo}>
                  undo
                </button>
                <button type="button" className="mailslot-tool" onClick={clear}>
                  clear
                </button>
              </div>
              <canvas
                ref={canvas}
                className={`mailslot-canvas${erasing ? ' is-erasing' : ''}`}
                width={CANVAS_W}
                height={CANVAS_H}
                aria-label="Drawing area"
              />
            </div>
            <div className="mailslot-row">
              <label className="mailslot-field">
                <span>your name (optional)</span>
                <input name="name" autoComplete="name" />
              </label>
              <label className="mailslot-field">
                <span>your email, if you'd like a reply</span>
                <input name="email" type="email" autoComplete="email" />
              </label>
            </div>
            {/* FormSubmit settings, plus a hidden trap for spam bots */}
            <input type="hidden" name="_subject" value="A note through your portfolio mail slot" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="box" />
            <input type="text" name="_honey" className="mailslot-honey" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <input type="file" name="attachment" accept="image/png" hidden />
            <div className="mailslot-foot">
              {state === 'error' && (
                <p className="mailslot-error" role="alert">
                  That didn't go through. Try again, or email <a href={`mailto:${to}`}>{to}</a>.
                </p>
              )}
              <button type="submit" className="mailslot-send" disabled={empty || state === 'sending'}>
                {state === 'sending' ? 'sending…' : 'slip it in ✉'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>,
    document.body,
  );
}
