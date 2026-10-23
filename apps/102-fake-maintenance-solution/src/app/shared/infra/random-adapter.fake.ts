import {
  type EnvironmentProviders,
  Injectable,
  makeEnvironmentProviders,
} from '@angular/core';
import { RandomAdapter } from './random-adapter';

/**
 * Predictable "random" picks: the first item unless told otherwise.
 */
@Injectable()
export class RandomAdapterFake implements RandomAdapter {
  private _index = 0;

  pick<T>(items: T[]): T {
    const index = this._index < 0 ? items.length + this._index : this._index;
    return items[index];
  }

  /**
   * Picks the item at this index from now on.
   * Negative indexes count from the end.
   */
  setPickIndex(index: number): void {
    this._index = index;
  }
}

export function provideRandomAdapterFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    RandomAdapterFake,
    {
      provide: RandomAdapter,
      useExisting: RandomAdapterFake,
    },
  ]);
}
