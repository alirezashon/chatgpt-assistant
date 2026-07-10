import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { PopupApp } from '@/popup/PopupApp';
import { installExtensionDiagnostics } from '@/features/diagnostics';
import '@/styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Popup root element was not found.');
}

installExtensionDiagnostics('popup');

createRoot(rootElement).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
