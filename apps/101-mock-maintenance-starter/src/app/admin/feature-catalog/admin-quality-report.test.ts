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
import { AdminQualityReport } from './admin-quality-report.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: 'eggs', quantity: { amount: 6, unit: '' } },
    { name: 'tomatoes', quantity: { amount: 800, unit: 'g' } },
  ],
  steps: ['Cook the sauce.', 'Crack the eggs.', 'Serve.'],
};

const brownies: Recipe = {
  id: 'tahini-halva-brownies',
  course: 'dessert',
  name: 'Tahini and Halva Brownies',
  description: null,
  pictureUri: '/images/tahini-halva-brownies.svg',
  ingredients: [
    { name: 'dark chocolate', quantity: { amount: 200, unit: 'g' } },
    { name: 'butter', quantity: { amount: 200, unit: 'g' } },
  ],
  steps: ['Melt.', 'Mix.', 'Bake.'],
};

const sketchyFritters: Recipe = {
  id: 'courgette-fritters',
  course: 'starter',
  name: 'Courgette Fritters',
  description: '',
  pictureUri: 'http://example.com/fritters.jpg',
  ingredients: [{ name: 'courgettes' }, { name: 'eggs' }],
  steps: ['Fry.'],
};

const WHOLE_CATALOG_QUERY =
  'keywords=&maxIngredientCount=null&maxStepCount=null';

describe(AdminQualityReport, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminQualityReport();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('gives a perfect score to a complete recipe', async () => {
    const { search } = mountAdminQualityReport();
    search.mockImplementation(searchCatalog([shakshuka]));

    await expect.poll(() => rowTexts()).toEqual(['Shakshuka 100% ✅']);
  });

  it('reports a missing description', async () => {
    const { search } = mountAdminQualityReport();
    search.mockImplementation(searchCatalog([brownies]));

    await expect
      .poll(() => rowTexts())
      .toEqual(['Tahini and Halva Brownies 75% Missing description']);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('reports every issue of a sketchy recipe', async () => {
    const { search } = mountAdminQualityReport();
    search.mockImplementation(
      searchCatalog(
        [shakshuka, brownies, sketchyFritters].filter(
          (recipe) => recipe.steps.length < 3,
        ),
      ),
    );

    await expect
      .poll(() => rowTexts())
      .toEqual([
        'Courgette Fritters 0% Missing description Fewer than 3 steps Most ingredients have no quantity Picture is not served over https',
      ]);
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot('./__snapshots__/admin-quality-report.calls.json');
  });

  it('shows only recipes with issues when filtered', async () => {
    const { search } = mountAdminQualityReport();
    search
      .mockImplementationOnce(
        searchCatalog([shakshuka, brownies, sketchyFritters]),
      )
      .mockImplementation((params) =>
        throwError(
          () =>
            new Error(
              `filtering should not search again ${JSON.stringify(params)}`,
            ),
        ),
      );

    await expect
      .poll(() => rowNames())
      .toEqual([
        'Shakshuka',
        'Tahini and Halva Brownies',
        'Courgette Fritters',
      ]);
    await page
      .getByRole('checkbox', { name: 'Only recipes with issues' })
      .click();

    await expect
      .poll(() => rowNames())
      .toEqual(['Tahini and Halva Brownies', 'Courgette Fritters']);
    expect(search).toHaveBeenCalledOnce();
  });

  it('shows every recipe again once the filter is unchecked', async () => {
    const { search } = mountAdminQualityReport();
    search.mockReturnValue(of([shakshuka, brownies]));

    await expect
      .poll(() => rowNames())
      .toEqual(['Shakshuka', 'Tahini and Halva Brownies']);
    await page
      .getByRole('checkbox', { name: 'Only recipes with issues' })
      .click();
    await expect
      .poll(() => rowNames())
      .toEqual(['Tahini and Halva Brownies']);
    await page
      .getByRole('checkbox', { name: 'Only recipes with issues' })
      .click();

    await expect
      .poll(() => rowNames())
      .toEqual(['Shakshuka', 'Tahini and Halva Brownies']);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('tolerates up to half of the ingredients without quantity', async () => {
    const { search } = mountAdminQualityReport();
    search.mockImplementation((params) =>
      toQueryString(params) !== WHOLE_CATALOG_QUERY
        ? of([])
        : of([
            {
              ...shakshuka,
              ingredients: [
                { name: 'eggs', quantity: { amount: 6, unit: '' } },
                { name: 'salt' },
              ],
            },
          ]),
    );

    await expect.poll(() => rowTexts()).toEqual(['Shakshuka 100% ✅']);
  });

  it('reports a blank description and too few steps', async () => {
    const { search } = mountAdminQualityReport();
    search.mockReturnValue(
      of([{ ...shakshuka, description: '   ', steps: ['Cook.', 'Serve.'] }]),
    );

    await expect
      .poll(() => rowTexts())
      .toEqual(['Shakshuka 50% Missing description Fewer than 3 steps']);
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
  });

  it('links each recipe to its edit page', async () => {
    const { search } = mountAdminQualityReport();
    search.mockReturnValue(of([shakshuka, brownies]));

    await expect.poll(() => rowHrefs()).toEqual([
      '/admin/recipes/shakshuka/edit',
      '/admin/recipes/tahini-halva-brownies/edit',
    ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });
});

function mountAdminQualityReport() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminQualityReport);

  return { search };
}

/**
 * Mimics the backend: every filter but courses must be blank for a catalog
 * dump, and courses narrows the catalog down when present.
 */
function searchCatalog(catalog: Recipe[]) {
  return ({ courses, ...filters }: RecipeSearchParams) => {
    expect(filters).toEqual({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    return of(
      courses
        ? catalog.filter((recipe) => courses.includes(recipe.course))
        : catalog,
    );
  };
}

function toQueryString(params: RecipeSearchParams): string {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  ).toString();
}

function rowTexts() {
  return page.getByTestId('quality-row').elements().map((row) => rowText(row));
}

function rowNames() {
  return page
    .getByTestId('quality-row')
    .getByRole('link')
    .elements()
    .map((link) => link.textContent?.trim() ?? '');
}

function rowHrefs() {
  return page
    .getByTestId('quality-row')
    .getByRole('link')
    .elements()
    .map((link) => link.getAttribute('href'));
}

function rowText(row: Element) {
  return textOf(row);
}

function textOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }
  if (!(node instanceof Element)) {
    return '';
  }
  return [...node.childNodes]
    .map((child) => textOf(child))
    .filter((text) => text.length > 0)
    .join(' ');
}
