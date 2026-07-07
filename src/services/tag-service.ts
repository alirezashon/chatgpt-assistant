import { createServiceDescriptor } from '@/services/service-descriptor';
import type { ServiceDescriptor } from '@/shared/types';

export type TagService = ServiceDescriptor<'TagService'>;

export const tagService: TagService = createServiceDescriptor('TagService');
