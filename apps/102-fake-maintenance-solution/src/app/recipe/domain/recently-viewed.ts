import { computed, inject, Injectable, signal } from '@angular/core';
import { LocalStorage } from '@whiskmate/shared/infra';

const RECENTLY_VIEWED_STORAGE_KEY = 'whiskmate:recently-viewed';
const MAX_RECENTLY_VIEWED = 8;

/**
 * Recipe ids, most recently viewed first.
 */
@Injectable({ providedIn: 'root' })
export class RecentlyViewed {
  private _localStorage = inject(LocalStorage);
  private _ids = signal<string[]>(this._loadIds());

  ids = computed(() => this._ids());

  track(recipeId: string): void {
    this._ids.update((ids) => {
      const nextIds = [recipeId, ...ids.filter((id) => id !== recipeId)].slice(
        0,
        MAX_RECENTLY_VIEWED,
      );
      this._localStorage.setItem(
        RECENTLY_VIEWED_STORAGE_KEY,
        JSON.stringify(nextIds),
      );
      return nextIds;
    });
  }

  private _loadIds(): string[] {
    const storedValue = this._localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);

    if (storedValue == null) {
      return [];
    }

    try {
      return JSON.parse(storedValue) as string[];
    } catch {
      return [];
    }
  }
}
