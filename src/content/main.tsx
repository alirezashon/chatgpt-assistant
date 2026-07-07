import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ExtensionUiRoot } from '@/content/ExtensionUiRoot';
import { createExtensionShadowRoot } from '@/content/shadow/create-extension-shadow-root';
import shadowStyles from '@/content/styles/shadow.css?inline';

const { mountElement } = createExtensionShadowRoot(shadowStyles);

createRoot(mountElement).render(
  <StrictMode>
    <ExtensionUiRoot />
  </StrictMode>,
);
