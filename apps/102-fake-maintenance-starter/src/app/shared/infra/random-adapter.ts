import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RandomAdapter {
  pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}
