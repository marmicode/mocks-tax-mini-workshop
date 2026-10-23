import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe(ThreeStepRecipes.name, () => {
  it('searches recipes with at most three steps', async () => {
    const { fixture, search } = mountThreeStepRecipes();
    await fixture.whenStable();

    expect(search.mock.calls).toMatchSnapshot();
  });

  it('shows the three-step recipes', async () => {
    const { fixture, search } = mountThreeStepRecipes();
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
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('shows the steps of each recipe', async () => {
    const { fixture, search } = mountThreeStepRecipes();
    search.mockImplementation((params) => {
      expect(params).toEqual({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: 3,
        courses: [],
      });
      return of([salad]);
    });
    await fixture.whenStable();

    expect(search).toHaveBeenCalledOnce();
    expect(steps(fixture.nativeElement)).toEqual([
      'Burn the aubergine.',
      'Dress with tahini.',
    ]);
  });

  it('links each recipe to its detail page', async () => {
    const { fixture, search } = mountThreeStepRecipes();
    search.mockImplementation((params) =>
      isThreeStepSearch(params) ? of([hummus]) : of([]),
    );
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="recipe-name"]')
        ?.getAttribute('href'),
    ).toBe('/recipes/hummus-ful');
  });

  it('shows a message when there are no three-step recipes', async () => {
    const { fixture, search } = mountThreeStepRecipes();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 3,
      courses: [],
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No three-step recipes found');
  });
});

function mountThreeStepRecipes() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([hummus, salad]));

  const fixture = TestBed.createComponent(ThreeStepRecipes);

  return { fixture, search };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function steps(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-step"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
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
