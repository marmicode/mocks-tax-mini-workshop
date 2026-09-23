import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
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

describe(AdminDuplicates.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminDuplicates();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows "no duplicates" when every recipe is distinct', async () => {
    const { fixture, search } = mountAdminDuplicates();
    search.mockImplementation((params) => {
      expect(params.keywords).toBe('');
      expect(params).toHaveProperty('courses', []);
      return of([hummus, shakshuka]);
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-duplicates"]')
        ?.textContent,
    ).toContain('No duplicates found');
  });

  it('pairs recipes with the same normalized name', async () => {
    const { fixture, search } = mountAdminDuplicates();
    search.mockImplementation(
      respondToWholeCatalogSearch([hummus, shakshuka, fulHummus]),
    );
    await fixture.whenStable();

    expect(pairTexts(fixture.nativeElement)).toEqual([
      'Hummus with Ful ↔ Ful & Hummus (same name)',
    ]);
  });

  it('pairs recipes sharing most of their ingredients', async () => {
    const { fixture, search } = mountAdminDuplicates();
    search.mockReturnValue(of([aubergine, roastedAubergine, shakshuka]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(pairTexts(fixture.nativeElement)).toEqual([
      'Burnt Aubergine Salad ↔ Roasted Aubergine with Tahini (same ingredients)',
    ]);
  });

  it('links each duplicate to its edit page', async () => {
    const { fixture, search } = mountAdminDuplicates();
    search.mockImplementation((params) =>
      of(
        params.courses?.length
          ? [hummus, fulHummus].filter((recipe) =>
              params.courses?.includes(recipe.course),
            )
          : [hummus, fulHummus],
      ),
    );
    await fixture.whenStable();

    const links = [
      ...fixture.nativeElement.querySelectorAll(
        '[data-testid="duplicate-pair"] a',
      ),
    ].map((link) => (link as HTMLAnchorElement).getAttribute('href'));
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
    expect(links).toEqual([
      '/admin/recipes/hummus-ful/edit',
      '/admin/recipes/ful-and-hummus/edit',
    ]);
  });

  it('shows "no duplicates" when the catalog is empty', async () => {
    const { fixture, search } = mountAdminDuplicates();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(pairTexts(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-duplicates"]')
        ?.textContent,
    ).toContain('No duplicates found');
  });

  it('does not pair recipes sharing only some of their ingredients', async () => {
    const { fixture, search } = mountAdminDuplicates();
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
    await fixture.whenStable();

    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot('./__snapshots__/admin-duplicates.calls.json');
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-duplicates"]'),
    ).not.toBeNull();
  });

  it('reports same-name recipes as name duplicates even if ingredients match too', async () => {
    const { fixture, search } = mountAdminDuplicates();
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
    await fixture.whenStable();

    expect(pairTexts(fixture.nativeElement)).toEqual([
      'Hummus with Ful ↔ hummus with ful! (same name)',
    ]);
  });

  it('pairs every combination of duplicates', async () => {
    const { fixture, search } = mountAdminDuplicates();
    search.mockImplementation(
      respondToWholeCatalogSearch([
        hummus,
        fulHummus,
        { ...fulHummus, id: 'ful-with-hummus', name: 'Ful with Hummus' },
      ]),
    );
    await fixture.whenStable();

    expect(pairTexts(fixture.nativeElement)).toEqual([
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

  const fixture = TestBed.createComponent(AdminDuplicates);

  return { fixture, search };
}

function pairTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="duplicate-pair"]')].map(
    (el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

function respondToWholeCatalogSearch(recipes: Recipe[]) {
  return (params: RecipeSearchParams) =>
    Object.keys(params).length === 4 &&
    Object.values(params).every(
      (value) => value === '' || value === null || isEmptyArray(value),
    )
      ? of(recipes)
      : throwError(
          () => new Error(`unexpected search ${JSON.stringify(params)}`),
        );
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
