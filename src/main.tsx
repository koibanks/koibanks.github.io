import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import App from './App';
import './styles.css';

// Dev-only handle for poking at animations from the console.
if (import.meta.env.DEV) (window as unknown as { gsap: typeof gsap }).gsap = gsap;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
