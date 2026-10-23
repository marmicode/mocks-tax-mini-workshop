import {
  type EnvironmentProviders,
  Injectable,
  makeEnvironmentProviders,
} from '@angular/core';
import { ClockAdapter } from './clock-adapter';

/**
 * Clock that only moves when the test says so.
 */
@Injectable()
export class ClockAdapterFake implements ClockAdapter {
  private _now = new Date(2026, 0, 1);

  now(): Date {
    return this._now;
  }

  setNow(now: Date): void {
    this._now = now;
  }
}

export function provideClockAdapterFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    ClockAdapterFake,
    {
      provide: ClockAdapter,
      useExisting: ClockAdapterFake,
    },
  ]);
}
