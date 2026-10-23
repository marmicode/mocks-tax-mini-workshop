import {
  type EnvironmentProviders,
  Injectable,
  makeEnvironmentProviders,
} from '@angular/core';
import { LocalStorage } from './local-storage';

/**
 * In-memory stand-in for the browser's local storage.
 */
@Injectable()
export class LocalStorageFake implements LocalStorage {
  private _items = new Map<string, string>();

  getItem(key: string): string | null {
    return this._items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this._items.set(key, value);
  }
}

export function provideLocalStorageFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    LocalStorageFake,
    {
      provide: LocalStorage,
      useExisting: LocalStorageFake,
    },
  ]);
}
