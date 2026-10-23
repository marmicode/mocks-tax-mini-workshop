import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import { AdminMissingSteps } from './admin-missing-steps.ng';

describe(AdminMissingSteps.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminMissingSteps();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows an empty state when every recipe has steps', async () => {
    const { fixture, search } = mountAdminMissingSteps();
    search.mockImplementation((params) =>
      of(
        isWholeCatalogSearch(params)
          ? [
              {
                id: 'shakshuka',
                course: 'main',
                name: 'Shakshuka',
                description: 'Eggs poached in a spiced tomato sauce.',
                pictureUri: 'https://example.com/shakshuka.jpg',
                ingredients: [{ name: 'eggs' }],
                steps: ['Cook the sauce.', 'Crack the eggs.'],
              },
            ]
          : [],
      ),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledOnce();
    expect(emptyState(fixture.nativeElement)).toBe('Every recipe has steps.');
  });

  it('lists recipes without any step', async () => {
    const { fixture, search } = mountAdminMissingSteps();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [{ name: 'chickpeas' }],
          steps: [],
        },
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
    expect(rowTexts(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('lists recipes with only blank steps', async () => {
    const { fixture, search } = mountAdminMissingSteps();
    search.mockImplementation((params) =>
      of(
        !params.courses?.length
          ? [
              {
                id: 'courgette-fritters',
                course: 'starter',
                name: 'Courgette Fritters',
                description: null,
                pictureUri: 'https://example.com/fritters.jpg',
                ingredients: [{ name: 'courgettes' }],
                steps: ['', '  '],
              },
            ]
          : [],
      ),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters (2 blank)',
    ]);
  });

  it('ignores recipes with at least one real step', async () => {
    const { fixture, search } = mountAdminMissingSteps();
    search.mockImplementation((params) =>
      of(
        isWholeCatalogSearch(params)
          ? [
              {
                id: 'tahini-halva-brownies',
                course: 'dessert',
                name: 'Tahini and Halva Brownies',
                description: null,
                pictureUri: '/images/tahini-halva-brownies.svg',
                ingredients: [{ name: 'dark chocolate' }],
                steps: ['', 'Bake.'],
              },
              {
                id: 'hummus-ful',
                course: 'starter',
                name: 'Hummus with Ful',
                description: 'Creamy hummus.',
                pictureUri: 'https://example.com/hummus.jpg',
                ingredients: [{ name: 'chickpeas' }],
                steps: [],
              },
            ]
          : [],
      ),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledOnce();
    expect(rowTexts(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });
});

function mountAdminMissingSteps() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminMissingSteps);

  return { fixture, search };
}

function rowTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="missing-steps-row"]')].map(
    (row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    Object.keys(params).length === 3 &&
    Object.values(params).every((value) => value === '' || value === null)
  );
}
