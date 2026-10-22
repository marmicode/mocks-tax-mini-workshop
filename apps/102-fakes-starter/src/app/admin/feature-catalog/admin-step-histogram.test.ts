import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminStepHistogram } from './admin-step-histogram.ng';

describe(AdminStepHistogram.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminStepHistogram();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows an empty state when there are no recipes', async () => {
    const { fixture, search } = mountAdminStepHistogram();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(emptyState(fixture.nativeElement)).toBe('No recipes yet.');
  });

  it('counts a single recipe', async () => {
    const { fixture, search } = mountAdminStepHistogram();
    search.mockReturnValue(
      of([
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
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(histogram(fixture.nativeElement)).toEqual([
      { stepCount: '3', recipeCount: '1' },
    ]);
  });

  it('groups recipes with the same step count', async () => {
    const { fixture, search } = mountAdminStepHistogram();
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
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(histogram(fixture.nativeElement)).toEqual([
      { stepCount: '2', recipeCount: '2' },
    ]);
  });

  it('sorts buckets by step count, including recipes without steps', async () => {
    const { fixture, search } = mountAdminStepHistogram();
    search.mockReturnValue(
      of([
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
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(histogram(fixture.nativeElement)).toEqual([
      { stepCount: '0', recipeCount: '1' },
      { stepCount: '1', recipeCount: '1' },
      { stepCount: '4', recipeCount: '1' },
    ]);
  });
});

function mountAdminStepHistogram() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminStepHistogram);

  return { fixture, search };
}

function histogram(root: HTMLElement) {
  return [...root.querySelectorAll('[data-testid="histogram-row"]')].map(
    (row) => {
      const [stepCount, recipeCount] = [...row.querySelectorAll('td')].map(
        (cell) => cell.textContent?.trim(),
      );
      return { stepCount, recipeCount };
    },
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
