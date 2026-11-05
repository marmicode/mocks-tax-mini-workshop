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
import { AdminDuplicates } from './admin-duplicates.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
  steps: [],
};

const fulHummus: Recipe = {
  id: 'ful-and-hummus',
  course: 'starter',
  name: 'Ful & Hummus',
  description: null,
  pictureUri: 'https://example.com/ful.jpg',
  ingredients: [{ name: 'fava beans' }],
  steps: [],
};

const aubergine: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine Salad',
  description: null,
  pictureUri: 'https://example.com/aubergine.jpg',
  ingredients: [
    { name: 'aubergines' },
    { name: 'tahini' },
    { name: 'lemon juice' },
    { name: 'pomegranate' },
    { name: 'parsley' },
  ],
  steps: [],
};

const roastedAubergine: Recipe = {
  id: 'roasted-aubergine-tahini',
  course: 'starter',
  name: 'Roasted Aubergine with Tahini',
  description: null,
  pictureUri: 'https://example.com/roasted-aubergine.jpg',
  ingredients: [
    { name: 'Aubergines' },
    { name: 'tahini' },
    { name: 'lemon juice' },
    { name: 'pomegranate' },
    { name: 'mint' },
  ],
  steps: [],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
  steps: [],
};

describe(AdminDuplicates, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminDuplicates();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows "no duplicates" when every recipe is distinct', async () => {
    const { search } = mountAdminDuplicates();
    search.mockImplementation((params) => {
      expect(params.keywords).toBe('');
      expect(params).toHaveProperty('courses', []);
      return of([hummus, shakshuka]);
    });

    await expect
      .element(page.getByTestId('no-duplicates'))
      .toHaveTextContent('No duplicates found');
  });

  it('pairs recipes with the same normalized name', async () => {
    const { search } = mountAdminDuplicates();
    search.mockImplementation(
      respondToWholeCatalogSearch([hummus, shakshuka, fulHummus]),
    );

    await expect
      .poll(() => pairTexts())
      .toEqual(['Hummus with Ful ↔ Ful & Hummus (same name)']);
  });

  it('pairs recipes sharing most of their ingredients', async () => {
    const { search } = mountAdminDuplicates();
    search.mockReturnValue(of([aubergine, roastedAubergine, shakshuka]));

    await expect
      .poll(() => pairTexts())
      .toEqual([
        'Burnt Aubergine Salad ↔ Roasted Aubergine with Tahini (same ingredients)',
      ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('links each duplicate to its edit page', async () => {
    const { search } = mountAdminDuplicates();
    search.mockImplementation((params) =>
      of(
        params.courses.length > 0
          ? [hummus, fulHummus].filter((recipe) =>
              params.courses.includes(recipe.course),
            )
          : [hummus, fulHummus],
      ),
    );

    await expect.poll(() => pairHrefs()).toEqual([
      '/admin/recipes/hummus-ful/edit',
      '/admin/recipes/ful-and-hummus/edit',
    ]);
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

  it('shows "no duplicates" when the catalog is empty', async () => {
    const { search } = mountAdminDuplicates();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-duplicates'))
      .toHaveTextContent('No duplicates found');
    expect(pairTexts()).toEqual([]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('does not pair recipes sharing only some of their ingredients', async () => {
    const { search } = mountAdminDuplicates();
    search.mockReturnValue(
      of([
        aubergine,
        {
          ...roastedAubergine,
          ingredients: [
            { name: 'aubergines' },
            { name: 'tahini' },
            { name: 'lemon juice' },
            { name: 'garlic' },
            { name: 'mint' },
          ],
        },
      ]),
    );

    await expect.element(page.getByTestId('no-duplicates')).toBeVisible();
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot('./__snapshots__/admin-duplicates.calls.json');
  });

  it('reports same-name recipes as name duplicates even if ingredients match too', async () => {
    const { search } = mountAdminDuplicates();
    search.mockImplementationOnce((params) => {
      expect(Object.keys(params)).toEqual([
        'keywords',
        'maxIngredientCount',
        'maxStepCount',
        'courses',
      ]);
      return of([
        hummus,
        { ...hummus, id: 'hummus-copy', name: 'hummus with ful!' },
      ]);
    });

    await expect
      .poll(() => pairTexts())
      .toEqual(['Hummus with Ful ↔ hummus with ful! (same name)']);
  });

  it('pairs every combination of duplicates', async () => {
    const { search } = mountAdminDuplicates();
    search.mockImplementation(
      respondToWholeCatalogSearch([
        hummus,
        fulHummus,
        { ...fulHummus, id: 'ful-with-hummus', name: 'Ful with Hummus' },
      ]),
    );

    await expect
      .poll(() => pairTexts())
      .toEqual([
        'Hummus with Ful ↔ Ful & Hummus (same name)',
        'Hummus with Ful ↔ Ful with Hummus (same name)',
        'Ful & Hummus ↔ Ful with Hummus (same name)',
      ]);
  });
});

function mountAdminDuplicates() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminDuplicates);

  return { search };
}

function pairTexts() {
  return page
    .getByTestId('duplicate-pair')
    .elements()
    .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

function pairHrefs() {
  return page
    .getByTestId('duplicate-pair')
    .getByRole('link')
    .elements()
    .map((link) => link.getAttribute('href'));
}

function respondToWholeCatalogSearch(recipes: Recipe[]) {
  return (params: RecipeSearchParams) =>
    params.keywords === '' &&
    params.maxIngredientCount === null &&
    params.maxStepCount === null &&
    params.courses.length === 0
      ? of(recipes)
      : throwError(
          () => new Error(`unexpected search ${JSON.stringify(params)}`),
        );
}
