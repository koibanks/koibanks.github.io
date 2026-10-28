import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentType } from 'react';
import { projects as baseProjects } from './data/projects';
import { hrefFor, parseHash, useHash } from './hooks/useHashRoute';
import { useReducedMotion } from './hooks/useMedia';
import { useStepNavigation } from './hooks/useStepNavigation';
import { About } from './components/About';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { customFontFaces } from './data/fonts';
import { designVars, googleFontsUrl, useDesign, useEditor } from './lib/design';
import { getSite, withText } from './lib/text';

// Project pages load on demand (and are fetched in the background once the front page is idle).
const loadCase = () => import('./components/CaseStudy');
const CaseStudy = lazy(() => loadCase().then((m) => ({ default: m.CaseStudy })));

// The Design panel only exists while running locally (npm run dev); it is left out of the built site.
const DesignPanel = import.meta.env.DEV
  ? lazy(() => import('./components/DesignPanel').then((m) => ({ default: m.DesignPanel })))
  : null;

// The live site always uses the split home page. The other layouts are only
// offered while designing (npm run dev), and never ship.
const HOMES: Partial<Record<string, ComponentType<ComponentProps<typeof Home>>>> = import.meta.env.DEV
  ? {
      tabs: lazy(() => import('./components/home/HomeTabs').then((m) => ({ default: m.HomeTabs }))),
      cabinet: lazy(() => import('./components/home/HomeCabinet').then((m) => ({ default: m.HomeCabinet }))),
      desk: lazy(() => import('./components/home/HomeDesk').then((m) => ({ default: m.HomeDesk }))),
    }
  : {};

type View = 'home' | 'case' | 'about';

const indexOf = (id: string) => baseProjects.findIndex((p) => p.id === id);

export default function App() {
  const reduced = useReducedMotion();
  const design = useDesign();
  const HomeView = (import.meta.env.DEV && HOMES[design.home]) || Home;
  // Your text edits ("Edit text" in the Design panel) applied to all copy.
  const projects = useMemo(() => withText(baseProjects), [design.text]);
  const site = getSite();

  // Apply colors and sizes from the design settings.
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(designVars(design))) root.style.setProperty(k, v);
    root.dataset.textSide = design.textSide;
    root.dataset.textAlign = design.textAlign;
  }, [design]);

  // Fetch the project page code while idle, so opening a file is instant.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => void loadCase());
  }, []);

  // Your own fonts (src/data/fonts.ts): declare them once; files load only when used.
  useEffect(() => {
    if (document.getElementById('custom-fonts')) return;
    const style = document.createElement('style');
    style.id = 'custom-fonts';
    style.textContent = customFontFaces();
    document.head.appendChild(style);
  }, []);

  // Load the chosen web fonts (Google Fonts), if any.
  const fontsUrl = googleFontsUrl(design);
  useEffect(() => {
    let link = document.getElementById('design-fonts') as HTMLLinkElement | null;
    if (!fontsUrl) return void link?.remove();
    if (!link) {
      link = document.createElement('link');
      link.id = 'design-fonts';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== fontsUrl) link.href = fontsUrl;
  }, [fontsUrl]);

  // While moving things around, scrolling and arrow keys shouldn't switch files.
  const { editing, texting } = useEditor();
  const route = parseHash(useHash());
  const caseIndex = route.name === 'project' ? indexOf(route.id) : -1;
  const view: View = caseIndex >= 0 ? 'case' : route.name === 'about' ? 'about' : 'home';

  // The home page remembers which file it was on.
  const [index, setIndex] = useState(() => Math.max(0, caseIndex));
  useEffect(() => {
    if (caseIndex >= 0) setIndex(caseIndex);
  }, [caseIndex]);

  // Unknown project id → home.
  useEffect(() => {
    if (route.name === 'project' && caseIndex < 0) window.location.replace(hrefFor.cabinet);
  }, [route.name, caseIndex]);

  // "Back" uses browser history when we came from home, so back/forward stay in sync.
  const fromHome = useRef(false);
  const prevView = useRef<View>(view);
  useEffect(() => {
    if (view === 'case' && prevView.current === 'home') fromHome.current = true;
    else if (view !== 'case') fromHome.current = false;
    prevView.current = view;
  }, [view]);

  const goHome = () => {
    if (fromHome.current) window.history.back();
    else window.location.hash = hrefFor.cabinet;
  };

  useEffect(() => {
    if (view === 'home') return;
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.lightbox, .mailslot')) return; // an overlay is open: its keys come first
      // Let Escape work normally while typing (e.g. in the font tester).
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === 'Escape' && tag !== 'TEXTAREA' && tag !== 'INPUT') goHome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(projects.length - 1, i)));
  useStepNavigation({
    enabled: view === 'home' && !editing && !texting,
    onStep: (dir) => setIndex((i) => Math.max(0, Math.min(projects.length - 1, i + dir))),
    onJump: (to) => goTo(to === 'first' ? 0 : projects.length - 1),
  });

  useEffect(() => {
    document.title =
      view === 'case'
        ? `${projects[caseIndex].title} — ${site.name}`
        : view === 'about'
          ? `About — ${site.name}`
          : `${site.name} — ${site.role}`;
  }, [view, caseIndex, projects, site.name, site.role]);

  return (
    <>
      {/* A button, not a #link: hash links would change the route. */}
      <button
        type="button"
        className="skip-link"
        onClick={() =>
          document.querySelector<HTMLElement>(view === 'case' ? '#case-title' : '[data-home-focus]')?.focus()
        }
      >
        Skip to content
      </button>
      <Header aboutActive={view === 'about'} />
      <Suspense fallback={null}>
        <HomeView projects={projects} index={index} active={view === 'home'} reduced={reduced} onSelect={goTo} />
      </Suspense>
      {view === 'case' && (
        <Suspense fallback={null}>
          <CaseStudy key={projects[caseIndex].id} projects={projects} index={caseIndex} reduced={reduced} onBack={goHome} />
        </Suspense>
      )}
      {view === 'about' && <About reduced={reduced} />}
      {DesignPanel && (
        <Suspense fallback={null}>
          <DesignPanel projects={projects} />
        </Suspense>
      )}
    </>
  );
}
