import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type Observable, of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, type MockInstance, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AlphabeticalIndex } from './alphabetical-index.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
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

const sabich: Recipe = {
  id: 'sabich',
  course: 'main',
  name: 'Sabich',
  description: null,
  pictureUri: 'https://example.com/sabich.jpg',
  ingredients: [],
  steps: [],
};

/**
 * The index is built from the whole catalog.
 */
const allRecipes = JSON.stringify({
  keywords: '',
  maxIngredientCount: null,
  maxStepCount: null,
  courses: [],
});

describe(AlphabeticalIndex, () => {
  it('searches all recipes', async () => {
    const { search } = mountAlphabeticalIndex();

    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: [],
      });
  });

  it('groups recipes by first letter in alphabetical order', async () => {
    const { search } = mountAlphabeticalIndex();
    respondTo(search, { [allRecipes]: [shakshuka, salad, sabich] });

    await expect.poll(letters).toEqual(['B', 'S']);
  });

  it('sorts recipes by name within a letter', async () => {
    const { search } = mountAlphabeticalIndex();
    respondTo(search, { [allRecipes]: [shakshuka, sabich] });

    await expect.poll(recipeNames).toEqual(['Sabich', 'Shakshuka']);
  });

  it('puts recipes not starting with a letter at the end', async () => {
    const { search } = mountAlphabeticalIndex();
    search.mockReturnValue(
      of([
        {
          id: '7-hour-lamb',
          course: 'main',
          name: '7-hour Lamb',
          description: null,
          pictureUri: 'https://example.com/lamb.jpg',
          ingredients: [],
          steps: [],
        },
        shakshuka,
      ]),
    );

    await expect.poll(letters).toEqual(['S', '#']);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('links each recipe to its detail page', async () => {
    const { search } = mountAlphabeticalIndex();
    respondTo(search, { [allRecipes]: [sabich] });

    await expect
      .element(page.getByRole('link', { name: 'Sabich' }))
      .toHaveTextContent('Sabich');
    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveAttribute('href', '/recipes/sabich');
  });

  it('shows a message when there are no recipes', async () => {
    const { search } = mountAlphabeticalIndex();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipes to index');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });
});

function mountAlphabeticalIndex() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([shakshuka, salad]));

  TestBed.createComponent(AlphabeticalIndex);

  return { search };
}

function letters() {
  return page
    .getByTestId('letter')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

/**
 * Responds to the searches listed in `routes` (keyed by the serialized search
 * params) and with no recipes to any other search.
 */
function respondTo(
  search: MockInstance<(params: RecipeSearchParams) => Observable<Recipe[]>>,
  routes: Record<string, Recipe[]>,
) {
  search.mockImplementation((params) =>
    of(routes[JSON.stringify(params)] ?? []),
  );
}
