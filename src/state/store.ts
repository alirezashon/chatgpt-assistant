import { AppError } from '@/shared/errors';

export type StoreListener = () => void;
export type Unsubscribe = () => void;

export type StateUpdater<State extends object> =
  Readonly<Partial<State>> | ((currentState: Readonly<State>) => Readonly<Partial<State>>);

export interface Store<State extends object> {
  getState(): Readonly<State>;
  replaceState(nextState: Readonly<State>): void;
  setState(updater: StateUpdater<State>): void;
  subscribe(listener: StoreListener): Unsubscribe;
}

export function createStore<State extends object>(initialState: Readonly<State>): Store<State> {
  let state = Object.freeze({ ...initialState });
  const listeners = new Set<StoreListener>();

  function emitChange(): void {
    for (const listener of listeners) {
      try {
        listener();
      } catch (cause) {
        throw new AppError('STATE_ERROR', 'State subscriber failed.', { cause });
      }
    }
  }

  return {
    getState() {
      return state;
    },

    replaceState(nextState) {
      state = Object.freeze({ ...nextState });
      emitChange();
    },

    setState(updater) {
      const patch = typeof updater === 'function' ? updater(state) : updater;
      state = Object.freeze({
        ...state,
        ...patch,
      });
      emitChange();
    },

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
