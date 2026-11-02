import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import { AdminMissingSteps } from './admin-missing-steps.ng';

describe(AdminMissingSteps, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminMissingSteps();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows an empty state when every recipe has steps', async () => {
    const { search } = mountAdminMissingSteps();
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

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('Every recipe has steps.');
    expect(search).toHaveBeenCalledOnce();
  });

  it('lists recipes without any step', async () => {
    const { search } = mountAdminMissingSteps();
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

    await expect
      .element(page.getByTestId('missing-steps-row'))
      .toHaveTextContent('Hummus with Ful');
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

  it('lists recipes with only blank steps', async () => {
    const { search } = mountAdminMissingSteps();
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

    await expect
      .element(page.getByTestId('missing-steps-row'))
      .toHaveTextContent('Courgette Fritters (2 blank)');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('ignores recipes with at least one real step', async () => {
    const { search } = mountAdminMissingSteps();
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

    await expect
      .element(page.getByTestId('missing-steps-row'))
      .toHaveTextContent('Hummus with Ful');
    expect(search).toHaveBeenCalledOnce();
  });
});

function mountAdminMissingSteps() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminMissingSteps);

  return { search };
}

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    Object.keys(params).length === 4 &&
    Object.values(params).every(
      (value) => value === '' || value === null || isEmptyArray(value),
    )
  );
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
