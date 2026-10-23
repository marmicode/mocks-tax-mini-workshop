import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminMissingIngredients } from './admin-missing-ingredients.ng';

describe(AdminMissingIngredients.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminMissingIngredients();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows an empty state when every recipe has ingredients', async () => {
    const { fixture, search } = mountAdminMissingIngredients();
    search.mockReturnValue(
      of([
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: 'Eggs poached in a spiced tomato sauce.',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
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
    expect(emptyState(fixture.nativeElement)).toBe(
      'Every recipe has ingredients.',
    );
  });

  it('lists recipes without any ingredient', async () => {
    const { fixture, search } = mountAdminMissingIngredients();
    search.mockReturnValue(
      of([
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [],
          steps: ['Fry.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters — no ingredients',
    ]);
  });

  it('lists recipes with unnamed ingredients', async () => {
    const { fixture, search } = mountAdminMissingIngredients();
    search.mockReturnValue(
      of([
        {
          id: 'tahini-halva-brownies',
          course: 'dessert',
          name: 'Tahini and Halva Brownies',
          description: null,
          pictureUri: '/images/tahini-halva-brownies.svg',
          ingredients: [{ name: 'butter' }, { name: '' }, { name: ' ' }],
          steps: ['Bake.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies — 2 unnamed ingredient(s)',
    ]);
  });

  it('only lists incomplete recipes', async () => {
    const { fixture, search } = mountAdminMissingIngredients();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [{ name: 'chickpeas' }],
          steps: ['Blend.'],
        },
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [],
          steps: ['Fry.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters — no ingredients',
    ]);
  });
});

function mountAdminMissingIngredients() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminMissingIngredients);

  return { fixture, search };
}

function rowTexts(root: HTMLElement): string[] {
  return [
    ...root.querySelectorAll('[data-testid="missing-ingredients-row"]'),
  ].map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
