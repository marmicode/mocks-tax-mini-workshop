import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
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

describe(FiveIngredientRecipes.name, () => {
  it('searches recipes with at most five ingredients', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
    });
  });

  it('shows the five-ingredient recipes', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('narrows the search with keywords', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    typeKeywords(fixture.nativeElement, 'hummus');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": 5,
            "maxStepCount": null,
          },
        ],
        [
          {
            "keywords": "hummus",
            "maxIngredientCount": 5,
            "maxStepCount": null,
          },
        ],
      ]
    `);
    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('searches again once keywords are cleared', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    typeKeywords(fixture.nativeElement, 'salad');
    await fixture.whenStable();
    typeKeywords(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(searchKey(search.mock.lastCall?.[0])).toBe(
      'keywords=&maxIngredientCount=5&maxStepCount=',
    );
  });

  it('shows a message when there are no five-ingredient recipes', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No five-ingredient recipes found');
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
        case 'keywords=&maxIngredientCount=5&maxStepCount=':
          return of([hummus, salad]);
        case 'keywords=hummus&maxIngredientCount=5&maxStepCount=':
          return of([hummus]);
        case 'keywords=salad&maxIngredientCount=5&maxStepCount=':
          return of([salad]);
        default:
          return throwError(
            () => new Error(`unexpected search ${searchKey(params)}`),
          );
      }
    });

  const fixture = TestBed.createComponent(FiveIngredientRecipes);

  return { fixture, search };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function typeKeywords(root: HTMLElement, keywords: string): void {
  const input = root.querySelector<HTMLInputElement>(
    '[data-testid="keywords-input"]',
  );
  if (input == null) {
    throw new Error('Keywords input not found.');
  }
  input.value = keywords;
  input.dispatchEvent(new Event('input'));
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
