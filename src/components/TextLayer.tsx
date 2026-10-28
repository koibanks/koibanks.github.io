import { useEffect } from 'react';
import { getDesign, setEditor, updateDesign, useEditor } from '../lib/design';

/**
 * Put `value` back into an edited element while keeping its existing text node,
 * so the page (React) can keep updating it afterwards.
 */
function setText(el: HTMLElement, value: string) {
  const node = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE) ?? document.createTextNode('');
  el.replaceChildren(node);
  node.nodeValue = value;
}

/**
 * The text you typed, with line breaks: innerText turns the browser's <br>/<div>
 * line breaks into "\n", and switching off text-transform keeps your real
 * capitals (not the uppercase-styled view).
 */
function readText(el: HTMLElement): string {
  const prev = el.style.textTransform;
  el.style.textTransform = 'none';
  const text = el.innerText;
  el.style.textTransform = prev;
  return text;
}

/**
 * "Edit text" mode (dev only). Every piece of text marked with data-text becomes
 * editable in place. Click into it and type; click away (or press Enter) to keep
 * the change, Esc to cancel. Edits are stored in design.text until you Save.
 */
export function TextLayer() {
  const { texting } = useEditor();

  useEffect(() => {
    if (!texting) return;
    document.body.classList.add('is-texting');
    const supportsPlain = (() => {
      const d = document.createElement('div');
      d.contentEditable = 'plaintext-only';
      return d.contentEditable === 'plaintext-only';
    })();

    const usable = (el: HTMLElement) =>
      // Everything except the panel, inactive pages and real <button>s (browsers can't edit inside those).
      !el.closest('.dpanel') && !el.closest('[inert]') && !el.closest('button');

    const enable = () => {
      document.querySelectorAll<HTMLElement>('[data-text]').forEach((el) => {
        if (!usable(el) || el.isContentEditable) return;
        el.contentEditable = supportsPlain ? 'plaintext-only' : 'true';
        el.spellcheck = true;
        el.dataset.textBefore = readText(el);
      });
    };
    enable();
    // New text appears as you switch files or pages; make it editable too.
    const mo = new MutationObserver(() => enable());
    mo.observe(document.body, { childList: true, subtree: true });

    const editableAt = (t: EventTarget | null) =>
      ((t as Element | null)?.closest?.('[data-text]') as HTMLElement | null) ?? null;

    // Clicking text places the caret instead of following links / opening folders.
    const onClick = (e: MouseEvent) => {
      const el = editableAt(e.target);
      if (el?.isContentEditable) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const el = editableAt(e.target);
      if (!el?.isContentEditable) return;
      e.stopPropagation(); // don't let page shortcuts (arrows, Esc) fire while typing
      if (e.key === 'Escape') {
        e.preventDefault();
        setText(el, el.dataset.textBefore ?? '');
        el.blur();
      } else if (e.key === 'Enter' && !('textMulti' in el.dataset)) {
        e.preventDefault();
        el.blur();
      } else if (e.key === 'Enter') {
        // Line break inside multi-line text, as a plain newline.
        e.preventDefault();
        document.execCommand('insertText', false, '\n');
      }
    };
    const onBlur = (e: FocusEvent) => {
      const el = editableAt(e.target);
      if (!el?.isContentEditable) return;
      const key = el.dataset.text!;
      const value = readText(el).replace(/\n{3,}/g, '\n\n').trim();
      const before = el.dataset.textBefore;
      el.dataset.textBefore = value;
      setText(el, value);
      if (value === before || (getDesign().text[key] ?? null) === value) return; // nothing changed
      updateDesign((x) => {
        x.text[key] = value;
      });
    };

    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('focusout', onBlur, true);
    return () => {
      document.body.classList.remove('is-texting');
      mo.disconnect();
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('focusout', onBlur, true);
      document.querySelectorAll<HTMLElement>('[data-text]').forEach((el) => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
      });
    };
  }, [texting]);

  // Esc with nothing focused leaves edit mode.
  useEffect(() => {
    if (!texting) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(document.activeElement as HTMLElement | null)?.isContentEditable) setEditor({ texting: false });
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [texting]);

  return null;
}
