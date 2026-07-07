import { createServiceDescriptor } from '@/services/service-descriptor';
import type { ServiceDescriptor } from '@/shared/types';

export type ExportService = ServiceDescriptor<'ExportService'>;

export const exportService: ExportService = createServiceDescriptor('ExportService');
