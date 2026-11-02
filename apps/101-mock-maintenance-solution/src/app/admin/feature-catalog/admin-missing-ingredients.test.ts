import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  createRecipeSearchParams,
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminMissingIngredients } from './admin-missing-ingredients.ng';

describe(AdminMissingIngredients, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminMissingIngredients();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows an empty state when every recipe has ingredients', async () => {
    const { search } = mountAdminMissingIngredients();
    search.mockReturnValue(
      of([
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: 'Eggs poached in a spiced tomato sauce.',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
          steps: ['Cook.'],
        },
      ]),
    );

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('Every recipe has ingredients.');
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('lists recipes without any ingredient', async () => {
    const { search } = mountAdminMissingIngredients();
    search.mockReturnValue(
      of([
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [],
          steps: ['Fry.'],
        },
      ]),
    );

    await expect
      .element(page.getByTestId('missing-ingredients-row'))
      .toHaveTextContent('Courgette Fritters — no ingredients');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('lists recipes with unnamed ingredients', async () => {
    const { search } = mountAdminMissingIngredients();
    const responses: Record<string, Recipe[]> = {
      [searchKey(createRecipeSearchParams())]: [
        {
          id: 'tahini-halva-brownies',
          course: 'dessert',
          name: 'Tahini and Halva Brownies',
          description: null,
          pictureUri: '/images/tahini-halva-brownies.svg',
          ingredients: [{ name: 'butter' }, { name: '' }, { name: ' ' }],
          steps: ['Bake.'],
        },
      ],
    };
    search.mockImplementation((params) =>
      searchKey(params) in responses
        ? of(responses[searchKey(params)])
        : throwError(() => new Error(`unexpected search ${searchKey(params)}`)),
    );

    await expect
      .element(page.getByTestId('missing-ingredients-row'))
      .toHaveTextContent('Tahini and Halva Brownies — 2 unnamed ingredient(s)');
  });

  it('only lists incomplete recipes', async () => {
    const { search } = mountAdminMissingIngredients();
    search.mockImplementation((params) => {
      if (
        params.keywords !== '' ||
        params.maxIngredientCount !== null ||
        params.maxStepCount !== null
      ) {
        return of([]);
      }
      const catalog: Recipe[] = [
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [{ name: 'chickpeas' }],
          steps: ['Blend.'],
        },
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [],
          steps: ['Fry.'],
        },
      ];
      return of(
        params.courses?.length
          ? catalog.filter((recipe) => params.courses?.includes(recipe.course))
          : catalog,
      );
    });

    await expect
      .element(page.getByTestId('missing-ingredients-row'))
      .toHaveTextContent('Courgette Fritters — no ingredients');
  });
});

function mountAdminMissingIngredients() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminMissingIngredients);

  return { search };
}

/**
 * Mirrors the backend cache key (`JSON.stringify` of the request body).
 */
function searchKey(params: RecipeSearchParams): string {
  return JSON.stringify(params);
}
