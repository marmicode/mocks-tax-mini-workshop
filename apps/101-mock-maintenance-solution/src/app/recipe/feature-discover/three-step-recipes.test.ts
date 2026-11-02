import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { ThreeStepRecipes } from './three-step-recipes.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: ['Blend the chickpeas.', 'Warm the ful.', 'Serve.'],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [],
  steps: ['Burn the aubergine.', 'Dress with tahini.'],
};

describe(ThreeStepRecipes, () => {
  it('searches recipes with at most three steps', async () => {
    const { search } = mountThreeStepRecipes();

    await expect.poll(() => search.mock.calls).toHaveLength(1);
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('shows the three-step recipes', async () => {
    const { search } = mountThreeStepRecipes();
    search.mockImplementation(
      (params) =>
        ({
          [JSON.stringify({
            keywords: '',
            maxIngredientCount: null,
            maxStepCount: 3,
            courses: [],
          })]: of([hummus, salad]),
          [JSON.stringify({
            keywords: '',
            maxIngredientCount: null,
            maxStepCount: 2,
            courses: [],
          })]: of([salad]),
        })[JSON.stringify(params)] ?? of([]),
    );

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('shows the steps of each recipe', async () => {
    const { search } = mountThreeStepRecipes();
    search.mockImplementation((params) => {
      expect(params).toEqual({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: 3,
        courses: [],
      });
      return of([salad]);
    });

    await expect
      .poll(steps)
      .toEqual(['Burn the aubergine.', 'Dress with tahini.']);
    expect(search).toHaveBeenCalledOnce();
  });

  it('links each recipe to its detail page', async () => {
    const { search } = mountThreeStepRecipes();
    search.mockImplementation((params) =>
      isThreeStepSearch(params) ? of([hummus]) : of([]),
    );

    await expect
      .element(page.getByRole('link', { name: 'Hummus with Ful' }))
      .toHaveTextContent('Hummus with Ful');
    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveAttribute('href', '/recipes/hummus-ful');
  });

  it('shows a message when there are no three-step recipes', async () => {
    const { search } = mountThreeStepRecipes();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No three-step recipes found');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 3,
      courses: [],
    });
  });
});

function mountThreeStepRecipes() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([hummus, salad]));

  TestBed.createComponent(ThreeStepRecipes);

  return { search };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function steps() {
  return page
    .getByTestId('recipe-step')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function isThreeStepSearch(params: RecipeSearchParams): boolean {
  const { maxStepCount, ...otherParams } = params;
  return (
    maxStepCount === 3 &&
    Object.values(otherParams).every(
      (value) => value === '' || value === null || isEmptyArray(value),
    )
  );
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
