import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { OptionsApp } from '@/options/OptionsApp';
import { AppProviders } from '@/providers';
import '@/styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Options root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <OptionsApp />
    </AppProviders>
  </StrictMode>,
);
