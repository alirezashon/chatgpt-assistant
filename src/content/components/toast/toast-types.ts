export type ToastTone = 'error' | 'success';

export interface Toast {
  readonly id: string;
  readonly message: string;
  readonly tone: ToastTone;
}

export interface ToastContextValue {
  readonly notify: (message: string, tone?: ToastTone) => void;
}
