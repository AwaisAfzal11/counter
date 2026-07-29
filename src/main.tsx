import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Latin subsets only — the whole shell is precached for offline use, so every
// unused glyph range is dead weight on a first load over 4G.
import '@fontsource/sora/latin-400.css';
import '@fontsource/sora/latin-600.css';
import '@fontsource/sora/latin-700.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './index.css';

import { App } from './App';
import { ClockProvider } from './context/ClockContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClockProvider>
      <App />
    </ClockProvider>
  </StrictMode>,
);
