import { AI_API_BASE_URL, APP_ENVIRONMENT, APP_NAME, APP_VERSION } from '@/constants/app';

export type AppEnvironment = 'development' | 'production' | 'staging' | 'test';

export interface RuntimeConfig {
  readonly aiApiBaseUrl: string;
  readonly appEnvironment: AppEnvironment;
  readonly appName: string;
  readonly appVersion: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

export const runtimeConfig: RuntimeConfig = {
  aiApiBaseUrl: AI_API_BASE_URL,
  appEnvironment: parseAppEnvironment(APP_ENVIRONMENT),
  appName: APP_NAME,
  appVersion: APP_VERSION,
  isDevelopment: APP_ENVIRONMENT !== 'production',
  isProduction: APP_ENVIRONMENT === 'production',
};

function parseAppEnvironment(value: string): AppEnvironment {
  switch (value) {
    case 'development':
    case 'production':
    case 'staging':
    case 'test':
      return value;
    default:
      return 'development';
  }
}
