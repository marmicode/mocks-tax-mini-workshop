import { Service } from '@angular/core';

@Service()
export class RandomAdapter {
  pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}
