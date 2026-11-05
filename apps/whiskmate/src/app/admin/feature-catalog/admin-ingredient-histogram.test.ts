import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminIngredientHistogram } from './admin-ingredient-histogram.ng';

describe(AdminIngredientHistogram, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminIngredientHistogram();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows an empty state when there are no recipes', async () => {
    const { search } = mountAdminIngredientHistogram();

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('No recipes yet.');
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/admin-ingredient-histogram.calls.json',
    );
  });

  it('counts a single recipe', async () => {
    const { search } = mountAdminIngredientHistogram();
    search.mockImplementation((params) => {
      switch (toQueryString(params)) {
        case 'keywords=&maxIngredientCount=&maxStepCount=':
          return of([
            {
              id: 'shakshuka',
              course: 'main',
              name: 'Shakshuka',
              description: 'Eggs poached in a spiced tomato sauce.',
              pictureUri: 'https://example.com/shakshuka.jpg',
              ingredients: [
                { name: 'eggs', quantity: { amount: 6, unit: '' } },
                { name: 'tomatoes', quantity: { amount: 800, unit: 'g' } },
              ],
              steps: ['Cook.'],
            },
          ]);
        default:
          return throwError(
            () => new Error(`unexpected search ${toQueryString(params)}`),
          );
      }
    });

    await expect.poll(() => histogram()).toEqual([
      { ingredientCount: '2', recipeCount: '1' },
    ]);
  });

  it('groups recipes with the same ingredient count', async () => {
    const { search } = mountAdminIngredientHistogram();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
          steps: ['Blend.'],
        },
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }, { name: 'eggs' }],
          steps: ['Fry.'],
        },
      ]),
    );

    await expect.poll(() => histogram()).toEqual([
      { ingredientCount: '2', recipeCount: '2' },
    ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('sorts buckets by ingredient count', async () => {
    const { search } = mountAdminIngredientHistogram();
    const catalog: Recipe[] = [
      {
        id: 'tahini-halva-brownies',
        course: 'dessert',
        name: 'Tahini and Halva Brownies',
        description: null,
        pictureUri: '/images/tahini-halva-brownies.svg',
        ingredients: [
          { name: 'dark chocolate' },
          { name: 'butter' },
          { name: 'tahini' },
          { name: 'halva' },
        ],
        steps: ['Bake.'],
      },
      {
        id: 'hummus-ful',
        course: 'starter',
        name: 'Hummus with Ful',
        description: 'Creamy hummus.',
        pictureUri: 'https://example.com/hummus.jpg',
        ingredients: [],
        steps: ['Blend.'],
      },
      {
        id: 'shakshuka',
        course: 'main',
        name: 'Shakshuka',
        description: null,
        pictureUri: 'https://example.com/shakshuka.jpg',
        ingredients: [{ name: 'eggs' }],
        steps: ['Cook.'],
      },
      {
        id: 'courgette-fritters',
        course: 'starter',
        name: 'Courgette Fritters',
        description: null,
        pictureUri: 'https://example.com/fritters.jpg',
        ingredients: [{ name: 'courgettes' }],
        steps: ['Fry.'],
      },
    ];
    search.mockImplementation(({ courses = [] }) =>
      of(
        catalog.filter(
          (recipe) => courses.length === 0 || courses.includes(recipe.course),
        ),
      ),
    );

    await expect.poll(() => histogram()).toEqual([
      { ingredientCount: '0', recipeCount: '1' },
      { ingredientCount: '1', recipeCount: '2' },
      { ingredientCount: '4', recipeCount: '1' },
    ]);
  });
});

function mountAdminIngredientHistogram() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminIngredientHistogram);

  return { search };
}

function histogram() {
  return page
    .getByTestId('histogram-row')
    .all()
    .map((row) => {
      const [ingredientCount, recipeCount] = row
        .getByRole('cell')
        .elements()
        .map((cell) => cell.textContent?.trim());
      return { ingredientCount, recipeCount };
    });
}

function toQueryString(params: RecipeSearchParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    query.set(key, Array.isArray(value) ? value.join(',') : (value ?? ''));
  }
  return query.toString();
}
