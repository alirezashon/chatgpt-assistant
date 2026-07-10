import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ExtensionUiRoot } from '@/content/ExtensionUiRoot';
import { createExtensionShadowRoot } from '@/content/shadow/create-extension-shadow-root';
import shadowStyles from '@/content/styles/shadow.css?inline';
import { startWorkspaceEngine } from '@/app/workspace';
import { installExtensionDiagnostics } from '@/features/diagnostics';

const { mountElement } = createExtensionShadowRoot(shadowStyles);

installExtensionDiagnostics('content-script');
void startWorkspaceEngine();

createRoot(mountElement).render(
  <StrictMode>
    <ExtensionUiRoot />
  </StrictMode>,
);
