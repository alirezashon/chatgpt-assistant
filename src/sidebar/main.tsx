import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@/providers';
import { SidebarApp } from '@/sidebar/SidebarApp';
import '@/styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Sidebar root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <SidebarApp />
    </AppProviders>
  </StrictMode>,
);
