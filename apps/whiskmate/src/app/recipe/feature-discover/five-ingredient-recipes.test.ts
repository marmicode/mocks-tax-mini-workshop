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
import { LocalStorage } from '@whiskmate/shared/infra';
import { FiveIngredientRecipes } from './five-ingredient-recipes.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [],
  steps: [],
};

describe(FiveIngredientRecipes, () => {
  it('searches recipes with at most five ingredients', async () => {
    const { search } = mountFiveIngredientRecipes();

    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: '',
        maxIngredientCount: 5,
        maxStepCount: null,
        courses: [],
      });
  });

  it('shows the five-ingredient recipes', async () => {
    mountFiveIngredientRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('narrows the search with keywords', async () => {
    const { search } = mountFiveIngredientRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);

    await page.getByLabelText('Keywords').fill('hummus');

    await expect.poll(recipeNames).toEqual(['Hummus with Ful']);
    expect(search).toHaveBeenCalledTimes(2);
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
            "keywords": "hummus",
            "maxIngredientCount": 5,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('searches again once keywords are cleared', async () => {
    const { search } = mountFiveIngredientRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);

    await page.getByLabelText('Keywords').fill('salad');
    await expect
      .poll(recipeNames)
      .toEqual(['Burnt Aubergine with Tahini and Pomegranate']);

    await page.getByLabelText('Keywords').fill('');
    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);

    expect(searchKey(search.mock.lastCall?.[0])).toBe(
      'keywords=&maxIngredientCount=5&maxStepCount=&courses=',
    );
  });

  it('shows a message when there are no five-ingredient recipes', async () => {
    const { search } = mountFiveIngredientRecipes();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No five-ingredient recipes found');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
  });
});

function mountFiveIngredientRecipes() {
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
    .mockImplementation((params) => {
      switch (searchKey(params)) {
        case 'keywords=&maxIngredientCount=5&maxStepCount=&courses=':
          return of([hummus, salad]);
        case 'keywords=hummus&maxIngredientCount=5&maxStepCount=&courses=':
          return of([hummus]);
        case 'keywords=salad&maxIngredientCount=5&maxStepCount=&courses=':
          return of([salad]);
        default:
          return throwError(
            () => new Error(`unexpected search ${searchKey(params)}`),
          );
      }
    });

  TestBed.createComponent(FiveIngredientRecipes);

  return { search };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

/**
 * Same shape as the query string the backend logs for each search.
 */
function searchKey(params: RecipeSearchParams | undefined): string {
  return new URLSearchParams(
    Object.entries(params ?? {}).map(([key, value]) => [
      key,
      value == null ? '' : String(value),
    ]),
  ).toString();
}
