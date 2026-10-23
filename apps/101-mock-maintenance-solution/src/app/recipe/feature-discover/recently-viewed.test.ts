import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecentlyViewed } from '@whiskmate/recipe/domain';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecentlyViewedPage } from './recently-viewed.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

describe(RecentlyViewedPage.name, () => {
  it('does not fetch anything when no recipe was viewed', async () => {
    const { fixture, findById } = mountRecentlyViewedPage([]);
    await fixture.whenStable();

    expect(findById).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="empty-message"]')
        ?.textContent,
    ).toContain("You haven't viewed any recipe yet.");
  });

  it('fetches each recently viewed recipe by id', async () => {
    const { fixture, findById } = mountRecentlyViewedPage([
      'hummus-ful',
      'shakshuka',
    ]);
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledTimes(2);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'hummus-ful' });
    expect(findById).toHaveBeenNthCalledWith(2, { id: 'shakshuka' });
  });

  it('lists recipes in the recently viewed order', async () => {
    const { fixture, findById } = mountRecentlyViewedPage([
      'hummus-ful',
      'shakshuka',
    ]);
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledTimes(2);
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
    ]);
  });

  it('links to the recipe detail', async () => {
    const { fixture, findById } = mountRecentlyViewedPage(['shakshuka']);
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(
      fixture.nativeElement.querySelector('li a')?.getAttribute('href'),
    ).toBe('/recipes/shakshuka');
  });

  it('skips recipes that no longer exist', async () => {
    const { fixture, findById } = mountRecentlyViewedPage([
      'deleted-recipe',
      'shakshuka',
    ]);
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledWith({ id: 'deleted-recipe' });
    expect(recipeNames(fixture.nativeElement)).toEqual(['Shakshuka']);
  });
});

function mountRecentlyViewedPage(ids: string[]) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: LocalStorage,
        useValue: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
        },
      },
    ],
  });

  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockImplementation(({ id }) =>
      of([shakshuka, hummus].find((recipe) => recipe.id === id)),
    );
  vi.spyOn(TestBed.inject(RecentlyViewed), 'ids').mockReturnValue(ids);

  const fixture = TestBed.createComponent(RecentlyViewedPage);

  return { fixture, findById };
}

function recipeNames(root: HTMLElement): string[] {
  return [
    ...root.querySelectorAll('[data-testid="recently-viewed-recipe"] a'),
  ].map((el) => el.textContent?.trim() ?? '');
}
