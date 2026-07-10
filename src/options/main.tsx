import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { OptionsApp } from '@/options/OptionsApp';
import { installExtensionDiagnostics } from '@/features/diagnostics';
import '@/styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Options root element was not found.');
}

installExtensionDiagnostics('options');

createRoot(rootElement).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
