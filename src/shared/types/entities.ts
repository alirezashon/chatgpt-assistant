export type EntityId = string;
export type ISODateTimeString = string;

export interface Workspace {
  readonly id: EntityId;
  readonly createdAt: ISODateTimeString;
  readonly name: string;
  readonly updatedAt: ISODateTimeString;
}

export interface Chat {
  readonly id: EntityId;
  readonly createdAt?: ISODateTimeString;
  readonly title: string;
  readonly updatedAt?: ISODateTimeString;
  readonly url: string;
}

export interface Folder {
  readonly color: string;
  readonly id: EntityId;
  readonly icon: string;
  readonly createdAt: ISODateTimeString;
  readonly name: string;
  readonly order: number;
  readonly updatedAt: ISODateTimeString;
}

export interface Tag {
  readonly id: EntityId;
  readonly color?: string;
  readonly createdAt: ISODateTimeString;
  readonly name: string;
  readonly updatedAt: ISODateTimeString;
}

export interface Favorite {
  readonly chatId: EntityId;
  readonly createdAt: ISODateTimeString;
}

export type ExportFormat = 'markdown' | 'pdf';

export type WorkspaceTheme = 'light' | 'system';
export type WorkspaceThemePreset = 'classic' | 'mint' | 'ocean' | 'violet';

export interface WorkspaceSettings {
  readonly enableDebugLogging: boolean;
  readonly schemaVersion: number;
  readonly sidebarWidth: number;
  readonly theme: WorkspaceTheme;
  readonly themePreset: WorkspaceThemePreset;
}
