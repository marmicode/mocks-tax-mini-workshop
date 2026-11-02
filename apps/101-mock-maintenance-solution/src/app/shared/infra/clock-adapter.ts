import { Service } from '@angular/core';

@Service()
export class ClockAdapter {
  now(): Date {
    return new Date();
  }
}
