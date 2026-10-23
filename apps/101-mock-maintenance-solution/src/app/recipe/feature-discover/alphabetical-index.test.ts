import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type Observable, of } from 'rxjs';
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
});

describe(AlphabeticalIndex.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAlphabeticalIndex();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('groups recipes by first letter in alphabetical order', async () => {
    const { fixture, search } = mountAlphabeticalIndex();
    respondTo(search, { [allRecipes]: [shakshuka, salad, sabich] });
    await fixture.whenStable();

    expect(letters(fixture.nativeElement)).toEqual(['B', 'S']);
  });

  it('sorts recipes by name within a letter', async () => {
    const { fixture, search } = mountAlphabeticalIndex();
    respondTo(search, { [allRecipes]: [shakshuka, sabich] });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Sabich', 'Shakshuka']);
  });

  it('puts recipes not starting with a letter at the end', async () => {
    const { fixture, search } = mountAlphabeticalIndex();
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
    await fixture.whenStable();

    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
    expect(letters(fixture.nativeElement)).toEqual(['S', '#']);
  });

  it('links each recipe to its detail page', async () => {
    const { fixture, search } = mountAlphabeticalIndex();
    respondTo(search, { [allRecipes]: [sabich] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="recipe-name"]')
        ?.getAttribute('href'),
    ).toBe('/recipes/sabich');
  });

  it('shows a message when there are no recipes', async () => {
    const { fixture, search } = mountAlphabeticalIndex();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes to index');
  });
});

function mountAlphabeticalIndex() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([shakshuka, salad]));

  const fixture = TestBed.createComponent(AlphabeticalIndex);

  return { fixture, search };
}

function letters(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="letter"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
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
