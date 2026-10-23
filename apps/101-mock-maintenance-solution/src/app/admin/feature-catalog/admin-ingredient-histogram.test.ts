import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminIngredientHistogram } from './admin-ingredient-histogram.ng';

describe(AdminIngredientHistogram.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminIngredientHistogram();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows an empty state when there are no recipes', async () => {
    const { fixture, search } = mountAdminIngredientHistogram();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(emptyState(fixture.nativeElement)).toBe('No recipes yet.');
  });

  it('counts a single recipe', async () => {
    const { fixture, search } = mountAdminIngredientHistogram();
    search.mockReturnValue(
      of([
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: 'Eggs poached in a spiced tomato sauce.',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [
            { name: 'eggs', quantity: { amount: 6, unit: '' } },
            { name: 'tomatoes', quantity: { amount: 800, unit: 'g' } },
          ],
          steps: ['Cook.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(histogram(fixture.nativeElement)).toEqual([
      { ingredientCount: '2', recipeCount: '1' },
    ]);
  });

  it('groups recipes with the same ingredient count', async () => {
    const { fixture, search } = mountAdminIngredientHistogram();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
          steps: ['Blend.'],
        },
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }, { name: 'eggs' }],
          steps: ['Fry.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(histogram(fixture.nativeElement)).toEqual([
      { ingredientCount: '2', recipeCount: '2' },
    ]);
  });

  it('sorts buckets by ingredient count', async () => {
    const { fixture, search } = mountAdminIngredientHistogram();
    search.mockReturnValue(
      of([
        {
          id: 'tahini-halva-brownies',
          course: 'dessert',
          name: 'Tahini and Halva Brownies',
          description: null,
          pictureUri: '/images/tahini-halva-brownies.svg',
          ingredients: [
            { name: 'dark chocolate' },
            { name: 'butter' },
            { name: 'tahini' },
            { name: 'halva' },
          ],
          steps: ['Bake.'],
        },
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [],
          steps: ['Blend.'],
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
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }],
          steps: ['Fry.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(histogram(fixture.nativeElement)).toEqual([
      { ingredientCount: '0', recipeCount: '1' },
      { ingredientCount: '1', recipeCount: '2' },
      { ingredientCount: '4', recipeCount: '1' },
    ]);
  });
});

function mountAdminIngredientHistogram() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminIngredientHistogram);

  return { fixture, search };
}

function histogram(root: HTMLElement) {
  return [...root.querySelectorAll('[data-testid="histogram-row"]')].map(
    (row) => {
      const [ingredientCount, recipeCount] = [
        ...row.querySelectorAll('td'),
      ].map((cell) => cell.textContent?.trim());
      return { ingredientCount, recipeCount };
    },
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
