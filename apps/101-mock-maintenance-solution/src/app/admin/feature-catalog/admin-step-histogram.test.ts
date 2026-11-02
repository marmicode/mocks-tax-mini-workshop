import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminStepHistogram } from './admin-step-histogram.ng';

describe(AdminStepHistogram, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminStepHistogram();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows an empty state when there are no recipes', async () => {
    const { search } = mountAdminStepHistogram();
    search.mockImplementation((params) => {
      if (params.courses.length > 0) {
        throw new Error(
          `histogram must cover every course ${JSON.stringify(params)}`,
        );
      }
      return of([]);
    });

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('No recipes yet.');
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('counts a single recipe', async () => {
    const { search } = mountAdminStepHistogram();
    search.mockImplementation((params) =>
      params.courses.length > 0
        ? of([])
        : of([
            {
              id: 'shakshuka',
              course: 'main',
              name: 'Shakshuka',
              description: 'Eggs poached in a spiced tomato sauce.',
              pictureUri: 'https://example.com/shakshuka.jpg',
              ingredients: [{ name: 'eggs' }],
              steps: ['Cook the sauce.', 'Crack the eggs.', 'Serve.'],
            },
          ]),
    );

    await expect.poll(() => histogram()).toEqual([
      { stepCount: '3', recipeCount: '1' },
    ]);
  });

  it('groups recipes with the same step count', async () => {
    const { search } = mountAdminStepHistogram();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [{ name: 'chickpeas' }],
          steps: ['Blend.', 'Serve.'],
        },
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }],
          steps: ['Grate.', 'Fry.'],
        },
      ]),
    );

    await expect.poll(() => histogram()).toEqual([
      { stepCount: '2', recipeCount: '2' },
    ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('sorts buckets by step count, including recipes without steps', async () => {
    const { search } = mountAdminStepHistogram();
    search.mockImplementation((params) =>
      !Object.values(params).every(isBlankFilter)
        ? of([])
        : of([
            {
              id: 'tahini-halva-brownies',
              course: 'dessert',
              name: 'Tahini and Halva Brownies',
              description: null,
              pictureUri: '/images/tahini-halva-brownies.svg',
              ingredients: [{ name: 'butter' }],
              steps: ['Melt.', 'Mix.', 'Pour.', 'Bake.'],
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
            {
              id: 'shakshuka',
              course: 'main',
              name: 'Shakshuka',
              description: null,
              pictureUri: 'https://example.com/shakshuka.jpg',
              ingredients: [{ name: 'eggs' }],
              steps: ['Cook.'],
            },
          ]),
    );

    await expect.poll(() => histogram()).toEqual([
      { stepCount: '0', recipeCount: '1' },
      { stepCount: '1', recipeCount: '1' },
      { stepCount: '4', recipeCount: '1' },
    ]);
    expect(search.mock.calls).toMatchSnapshot();
  });
});

function mountAdminStepHistogram() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminStepHistogram);

  return { search };
}

function histogram() {
  return page
    .getByTestId('histogram-row')
    .all()
    .map((row) => {
      const [stepCount, recipeCount] = row
        .getByRole('cell')
        .elements()
        .map((cell) => cell.textContent?.trim());
      return { stepCount, recipeCount };
    });
}

function isBlankFilter(value: unknown): boolean {
  return value === '' || value === null || isEmptyArray(value);
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
