import { createServiceDescriptor } from '@/services/service-descriptor';
import type { ServiceDescriptor } from '@/shared/types';

export type WorkspaceService = ServiceDescriptor<'WorkspaceService'>;

export const workspaceService: WorkspaceService = createServiceDescriptor('WorkspaceService');
