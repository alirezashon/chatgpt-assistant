import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ExtensionUiRoot } from '@/content/ExtensionUiRoot';
import { createExtensionShadowRoot } from '@/content/shadow/create-extension-shadow-root';
import shadowStyles from '@/content/styles/shadow.css?inline';
import { installWorkspaceThemeSync } from '@/content/theme/workspace-theme-sync';
import { startWorkspaceEngine } from '@/app/workspace';
import { installExtensionDiagnostics } from '@/features/diagnostics';

const { hostElement, mountElement } = createExtensionShadowRoot(shadowStyles);

installExtensionDiagnostics('content-script');
void installWorkspaceThemeSync(hostElement);
void startWorkspaceEngine();

createRoot(mountElement).render(
  <StrictMode>
    <ExtensionUiRoot />
  </StrictMode>,
);
