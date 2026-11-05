import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeQuickSearch } from './recipe-quick-search.ng';

const burntAubergine: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/burnt-aubergine.jpg',
  ingredients: [],
  steps: [],
};

const roastedAubergine: Recipe = {
  id: 'roasted-aubergine-tahini',
  course: 'starter',
  name: 'Roasted Aubergine with Tahini and Pine Nuts',
  description: null,
  pictureUri: 'https://example.com/roasted-aubergine.jpg',
  ingredients: [],
  steps: [],
};

const SEARCH_PARAM_KEYS = [
  'keywords',
  'maxIngredientCount',
  'maxStepCount',
  'courses',
];

describe(RecipeQuickSearch, () => {
  it('does not search with less than 2 characters', async () => {
    const { search, suggestionNames } = mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('a');

    await expect
      .element(page.getByRole('searchbox', { name: 'Quick search' }))
      .toHaveValue('a');
    expect(search).not.toHaveBeenCalled();
    await expect.poll(() => suggestionNames()).toEqual([]);
  });

  it('searches by keywords', async () => {
    const { search, suggestionNames } = mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');

    await expect
      .poll(() => suggestionNames())
      .toEqual([
        'Burnt Aubergine with Tahini and Pomegranate',
        'Roasted Aubergine with Tahini and Pine Nuts',
      ]);
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('shows at most 5 suggestions', async () => {
    const { search, suggestionNames } = mountQuickSearch();
    search.mockImplementation((params) =>
      JSON.stringify(params) ===
      JSON.stringify({
        keywords: 'aub',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: [],
      })
        ? of(
            Array.from({ length: 7 }, (_, index) => ({
              ...burntAubergine,
              id: `aubergine-${index}`,
              name: `Aubergine ${index}`,
            })),
          )
        : of([]),
    );

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');

    await expect.poll(() => suggestionNames()).toHaveLength(5);
  });

  it('links suggestions to the recipe detail page', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');

    await expect
      .element(
        page.getByRole('link', {
          name: 'Burnt Aubergine with Tahini and Pomegranate',
        }),
      )
      .toHaveAttribute('href', '/recipes/burnt-aubergine-salad');
  });

  it('says when nothing matches', async () => {
    const { search } = mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('xyz');

    await expect
      .element(page.getByText('No recipes found'))
      .toHaveTextContent('No recipes found');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'xyz',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('clears the search once a suggestion is picked', async () => {
    const { suggestionNames } = mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');
    await page
      .getByRole('link', {
        name: 'Burnt Aubergine with Tahini and Pomegranate',
      })
      .click();

    await expect
      .element(page.getByRole('searchbox', { name: 'Quick search' }))
      .toHaveValue('');
    await expect.poll(() => suggestionNames()).toEqual([]);
  });

  it('trims keywords before searching', async () => {
    const { search, suggestionNames } = mountQuickSearch();

    await page
      .getByRole('searchbox', { name: 'Quick search' })
      .fill('  tahini  ');

    await expect
      .poll(() => suggestionNames())
      .toEqual([
        'Burnt Aubergine with Tahini and Pomegranate',
        'Roasted Aubergine with Tahini and Pine Nuts',
      ]);
    expect(search).toHaveBeenCalledOnce();
  });

  it('waits for 2 non-blank characters before searching', async () => {
    const { search } = mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('a ');
    await expect
      .element(page.getByRole('searchbox', { name: 'Quick search' }))
      .toHaveValue('a ');
    expect(search).not.toHaveBeenCalled();
    await page.getByRole('searchbox', { name: 'Quick search' }).fill('au');

    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: 'au',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: [],
      });
  });

  it('refines suggestions while typing', async () => {
    const { search, suggestionNames } = mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');
    await expect.poll(() => search.mock.calls).toHaveLength(1);
    await page.getByRole('searchbox', { name: 'Quick search' }).fill('pine');

    await expect
      .poll(() => suggestionNames())
      .toEqual(['Roasted Aubergine with Tahini and Pine Nuts']);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "aub",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
        [
          {
            "courses": [],
            "keywords": "pine",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('hides suggestions once keywords become too short again', async () => {
    const { search, suggestionNames } = mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');
    await expect
      .element(
        page.getByRole('link', {
          name: 'Burnt Aubergine with Tahini and Pomegranate',
        }),
      )
      .toBeVisible();
    await page.getByRole('searchbox', { name: 'Quick search' }).fill('a');

    await expect
      .element(page.getByRole('searchbox', { name: 'Quick search' }))
      .toHaveValue('a');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'aub',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    await expect.poll(() => suggestionNames()).toEqual([]);
    await expect
      .element(page.getByText('No recipes found'))
      .not.toBeInTheDocument();
  });
});

@Component({ template: '' })
class Blank {}

function mountQuickSearch() {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: '**', component: Blank }])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) => {
      /* Fail fast on params this stub does not know how to handle. */
      const unexpectedKeys = Object.keys(params).filter(
        (key) => !SEARCH_PARAM_KEYS.includes(key),
      );
      if (unexpectedKeys.length > 0) {
        return throwError(
          () =>
            new Error(`Unexpected search params: ${unexpectedKeys.join(', ')}`),
        );
      }

      const keywords = params.keywords.toLowerCase();
      return of(
        [burntAubergine, roastedAubergine].filter((recipe) =>
          recipe.name.toLowerCase().includes(keywords),
        ),
      );
    });

  TestBed.createComponent(RecipeQuickSearch);

  return {
    search,
    suggestionNames: () =>
      page
        .getByRole('link')
        .elements()
        .map((el) => el.textContent?.trim() ?? ''),
  };
}
