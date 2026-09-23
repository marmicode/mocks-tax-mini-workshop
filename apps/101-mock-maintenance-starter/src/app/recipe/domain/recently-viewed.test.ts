import { TestBed } from '@angular/core/testing';
import { describe, it, vi } from 'vitest';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecentlyViewed } from './recently-viewed';

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
    const { recentlyViewed, setItem } = setUpRecentlyViewed(
      JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8']),
    );

    recentlyViewed.track('9');

    const ids = ['9', '1', '2', '3', '4', '5', '6', '7'];
    expect(recentlyViewed.ids()).toEqual(ids);
    expect(setItem).toHaveBeenCalledExactlyOnceWith(
      'whiskmate:recently-viewed',
      JSON.stringify(ids),
    );
  });
});

function setUpRecentlyViewed(storedValue: string | null) {
  const setItem = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: LocalStorage,
        useValue: {
          getItem: vi.fn().mockReturnValue(storedValue),
          setItem,
        },
      },
    ],
  });
  return { recentlyViewed: TestBed.inject(RecentlyViewed), setItem };
}
