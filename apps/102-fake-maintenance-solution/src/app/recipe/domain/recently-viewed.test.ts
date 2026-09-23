import { TestBed } from '@angular/core/testing';
import { describe, it } from 'vitest';
import {
  LocalStorageFake,
  provideLocalStorageFake,
} from '@whiskmate/shared/infra';
import { RecentlyViewed } from './recently-viewed';

const RECENTLY_VIEWED_STORAGE_KEY = 'whiskmate:recently-viewed';

describe(RecentlyViewed.name, () => {
  it('tracks the most recently viewed recipe first', () => {
    const { recentlyViewed } = setUpRecentlyViewed(null);

    recentlyViewed.track('shakshuka');
    recentlyViewed.track('hummus-ful');

    expect(recentlyViewed.ids()).toEqual(['hummus-ful', 'shakshuka']);
  });

  it('moves a recipe viewed again to the top without duplicating it', () => {
    const { recentlyViewed } = setUpRecentlyViewed(
      JSON.stringify(['hummus-ful', 'shakshuka']),
    );

    recentlyViewed.track('shakshuka');

    expect(recentlyViewed.ids()).toEqual(['shakshuka', 'hummus-ful']);
  });

  it('keeps the 8 most recent recipes and persists them', () => {
    const { recentlyViewed, localStorageFake } = setUpRecentlyViewed(
      JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8']),
    );

    recentlyViewed.track('9');

    const ids = ['9', '1', '2', '3', '4', '5', '6', '7'];
    expect(recentlyViewed.ids()).toEqual(ids);
    expect(localStorageFake.getItem(RECENTLY_VIEWED_STORAGE_KEY)).toBe(
      JSON.stringify(ids),
    );
  });
});

function setUpRecentlyViewed(storedValue: string | null) {
  TestBed.configureTestingModule({
    providers: [provideLocalStorageFake()],
  });
  const localStorageFake = TestBed.inject(LocalStorageFake);
  if (storedValue != null) {
    localStorageFake.setItem(RECENTLY_VIEWED_STORAGE_KEY, storedValue);
  }
  return { recentlyViewed: TestBed.inject(RecentlyViewed), localStorageFake };
}
