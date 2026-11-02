import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { KeywordCollections } from './keyword-collections.ng';

const soup: Recipe = {
  id: 'lentil-soup',
  course: 'starter',
  name: 'Red Lentil Soup',
  description: null,
  pictureUri: 'https://example.com/soup.jpg',
  ingredients: [],
  steps: [],
};

const cake: Recipe = {
  id: 'orange-polenta-cake',
  course: 'dessert',
  name: 'Orange Polenta Cake',
  description: null,
  pictureUri: 'https://example.com/cake.jpg',
  ingredients: [],
  steps: [],
};

/**
 * Canned backend responses, keyed by the exact search request.
 */
const responses: Record<string, Recipe[]> = {
  '{"keywords":"soup","maxIngredientCount":null,"maxStepCount":null,"courses":[]}':
    [soup],
  '{"keywords":"salad","maxIngredientCount":null,"maxStepCount":null,"courses":[]}':
    [],
  '{"keywords":"cake","maxIngredientCount":null,"maxStepCount":null,"courses":[]}':
    [cake],
};

describe(KeywordCollections, () => {
  it('searches soups by default', async () => {
    const { search } = mountKeywordCollections();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'soup',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows the recipes of the collection', async () => {
    mountKeywordCollections();

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);
  });

  it('searches salads when the salads collection is chosen', async () => {
    const { search } = mountKeywordCollections();

    await expect.poll(() => search.mock.calls.length).toBe(1);

    await page.getByRole('radio', { name: 'Salads' }).click();

    await expect.poll(() => search.mock.calls.length).toBe(2);
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('shows cakes when the cakes collection is chosen', async () => {
    mountKeywordCollections();

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);

    await page.getByRole('radio', { name: 'Cakes' }).click();

    await expect.poll(recipeNames).toEqual(['Orange Polenta Cake']);
  });

  it('shows a message when the collection is empty', async () => {
    const { search } = mountKeywordCollections();

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);

    await page.getByRole('radio', { name: 'Salads' }).click();

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('Nothing in this collection yet');
    expect(search).toHaveBeenLastCalledWith({
      keywords: 'salad',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });
});

function mountKeywordCollections() {
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
      /* Collections only ever search by keywords. */
      if (Object.keys(params).length !== 4) {
        return throwError(
          () => new Error(`unexpected search ${JSON.stringify(params)}`),
        );
      }
      return of(responses[JSON.stringify(params)] ?? []);
    });

  TestBed.createComponent(KeywordCollections);

  return { search };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
