export type ServiceName =
  'ExportService' | 'FavoriteService' | 'FolderService' | 'TagService' | 'WorkspaceService';

export interface ServiceDescriptor<Name extends ServiceName = ServiceName> {
  readonly name: Name;
}
