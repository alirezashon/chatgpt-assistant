import { createServiceDescriptor } from '@/services/service-descriptor';
import type { ServiceDescriptor } from '@/shared/types';

export type FavoriteService = ServiceDescriptor<'FavoriteService'>;

export const favoriteService: FavoriteService = createServiceDescriptor('FavoriteService');
