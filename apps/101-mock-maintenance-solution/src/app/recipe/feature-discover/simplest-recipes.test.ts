import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, type MockInstance, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { SimplestRecipes } from './simplest-recipes.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'ful' }, { name: 'tahini' }],
  steps: [],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [{ name: 'aubergine' }, { name: 'tahini' }],
  steps: [],
};

describe(SimplestRecipes.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountSimplestRecipes();
    await fixture.whenStable();

    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot('./__snapshots__/simplest-recipes.calls.json');
  });

  it('shows recipes with the fewest ingredients first', async () => {
    const { fixture, search } = mountSimplestRecipes();
    givenCatalog(search, [hummus, salad]);
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Burnt Aubergine with Tahini and Pomegranate',
      'Hummus with Ful',
    ]);
  });

  it('sorts recipes with as many ingredients by name', async () => {
    const { fixture, search } = mountSimplestRecipes();
    givenCatalog(search, [
      {
        id: 'shakshuka',
        course: 'main',
        name: 'Shakshuka',
        description: null,
        pictureUri: 'https://example.com/shakshuka.jpg',
        ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
        steps: [],
      },
      salad,
    ]);
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Burnt Aubergine with Tahini and Pomegranate',
      'Shakshuka',
    ]);
  });

  it('shows the ingredient count of each recipe', async () => {
    const { fixture, search } = mountSimplestRecipes();
    givenCatalog(search, [hummus]);
    await fixture.whenStable();

    expect(search).toHaveBeenCalledOnce();
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="ingredient-count"]')
        ?.textContent?.trim(),
    ).toBe('3 ingredients');
  });

  it('shows a message when there are no recipes', async () => {
    const { fixture, search } = mountSimplestRecipes();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes found');
  });
});

function mountSimplestRecipes() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi.spyOn(TestBed.inject(RecipeRepository), 'search');
  givenCatalog(search, [hummus, salad]);

  const fixture = TestBed.createComponent(SimplestRecipes);

  return { fixture, search };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

/* Simplest recipes are sorted client-side, so the backend must be asked
 * for the whole catalog: `keywords=&maxIngredientCount=&maxStepCount=&courses=`. */
const WHOLE_CATALOG_QUERY =
  'keywords=&maxIngredientCount=&maxStepCount=&courses=';

function givenCatalog(
  search: MockInstance<RecipeRepository['search']>,
  recipes: Recipe[],
) {
  search.mockImplementation((params) =>
    toQueryString(params) === WHOLE_CATALOG_QUERY
      ? of(recipes)
      : throwError(
          () => new Error(`unexpected search ${toQueryString(params)}`),
        ),
  );
}

function toQueryString(params: RecipeSearchParams): string {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value ?? '')]),
  ).toString();
}
