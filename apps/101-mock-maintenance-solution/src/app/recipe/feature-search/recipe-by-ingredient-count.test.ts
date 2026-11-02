import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type Observable, of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecipeByIngredientCount } from './recipe-by-ingredient-count.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const RESULTS_BY_SEARCH: Record<string, Observable<Recipe[]>> = {
  '{"keywords":"","maxIngredientCount":3,"maxStepCount":null,"courses":[]}': of(
    [],
  ),
  '{"keywords":"","maxIngredientCount":5,"maxStepCount":null,"courses":[]}': of(
    [shakshuka],
  ),
  '{"keywords":"","maxIngredientCount":8,"maxStepCount":null,"courses":[]}': of(
    [hummus, shakshuka],
  ),
};

describe(RecipeByIngredientCount, () => {
  it('searches recipes with at most 5 ingredients by default', async () => {
    const { search } = mountRecipeByIngredientCount();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows the matching recipes', async () => {
    const { search, recipeNames } = mountRecipeByIngredientCount();
    search.mockImplementation((params) => {
      /* Only the ingredient count filter must be sent. */
      if (Object.keys(params).length !== 4 || params.maxIngredientCount !== 5) {
        return throwError(
          () => new Error(`unexpected search ${JSON.stringify(params)}`),
        );
      }
      return of([hummus, shakshuka]);
    });

    await expect
      .poll(() => recipeNames())
      .toEqual(['Hummus with Ful', 'Shakshuka']);
  });

  it('counts the matching recipes', async () => {
    const { search } = mountRecipeByIngredientCount();
    search.mockImplementation(
      (params) =>
        RESULTS_BY_SEARCH[JSON.stringify(params)] ??
        throwError(
          () => new Error(`unexpected search ${JSON.stringify(params)}`),
        ),
    );

    await expect
      .element(page.getByTestId('recipe-count'))
      .toHaveTextContent('1 recipes with at most 5 ingredients');
    expect(search).toHaveBeenCalledOnce();
  });

  it('searches with fewer ingredients when asked', async () => {
    const { search } = mountRecipeByIngredientCount();
    await expect.poll(() => search.mock.calls).toHaveLength(1);

    await page.getByRole('button', { name: 'At most 3 ingredients' }).click();

    await expect.poll(() => search.mock.calls).toHaveLength(2);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": 5,
            "maxStepCount": null,
          },
        ],
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": 3,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('searches with more ingredients when asked', async () => {
    const { search } = mountRecipeByIngredientCount();
    await expect.poll(() => search).toHaveBeenCalledOnce();

    search.mockReturnValue(of([]));
    await page.getByRole('button', { name: 'At most 8 ingredients' }).click();

    await expect.poll(() => search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: 8,
      maxStepCount: null,
      courses: [],
    });
    await expect
      .element(page.getByTestId('recipe-count'))
      .toHaveTextContent('0 recipes with at most 8 ingredients');
  });
});

function mountRecipeByIngredientCount() {
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

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([hummus]));

  TestBed.createComponent(RecipeByIngredientCount);

  return {
    search,
    recipeNames: () =>
      page
        .getByTestId('recipe-name')
        .elements()
        .map((el) => el.textContent?.trim() ?? ''),
  };
}
