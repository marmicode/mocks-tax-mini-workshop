import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
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

describe(RecentlyViewedPage, () => {
  it('does not fetch anything when no recipe was viewed', async () => {
    const { findById } = mountRecentlyViewedPage([]);

    await expect
      .element(page.getByTestId('empty-message'))
      .toMatchTextContent("You haven't viewed any recipe yet.");
    expect(findById).not.toHaveBeenCalled();
  });

  it('fetches each recently viewed recipe by id', async () => {
    const { findById } = mountRecentlyViewedPage(['hummus-ful', 'shakshuka']);

    await expect.poll(recipeNames).toEqual(['Hummus with Ful', 'Shakshuka']);
    expect(findById).toHaveBeenCalledTimes(2);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'hummus-ful' });
    expect(findById).toHaveBeenNthCalledWith(2, { id: 'shakshuka' });
  });

  it('lists recipes in the recently viewed order', async () => {
    const { findById } = mountRecentlyViewedPage(['hummus-ful', 'shakshuka']);

    await expect.poll(recipeNames).toEqual(['Hummus with Ful', 'Shakshuka']);
    expect(findById).toHaveBeenCalledTimes(2);
  });

  it('links to the recipe detail', async () => {
    const { findById } = mountRecentlyViewedPage(['shakshuka']);

    await expect
      .element(page.getByRole('link', { name: 'Shakshuka' }))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByRole('link', { name: 'Shakshuka' }))
      .toHaveAttribute('href', '/recipes/shakshuka');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('skips recipes that no longer exist', async () => {
    const { findById } = mountRecentlyViewedPage([
      'deleted-recipe',
      'shakshuka',
    ]);

    await expect.poll(recipeNames).toEqual(['Shakshuka']);
    expect(findById).toHaveBeenCalledWith({ id: 'deleted-recipe' });
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

  TestBed.createComponent(RecentlyViewedPage);

  return { findById };
}

function recipeNames() {
  return page
    .getByTestId('recently-viewed-recipe')
    .getByRole('link')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
