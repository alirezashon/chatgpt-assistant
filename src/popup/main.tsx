import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { PopupApp } from '@/popup/PopupApp';
import '@/styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Popup root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
