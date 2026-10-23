import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminMissingIngredients } from './admin-missing-ingredients.ng';

describe(AdminMissingIngredients.name, () => {
  it('shows an empty state when every recipe has ingredients', async () => {
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: 'Eggs poached in a spiced tomato sauce.',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
          steps: ['Cook.'],
        },
      ],
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe(
      'Every recipe has ingredients.',
    );
  });

  it('lists recipes without any ingredient', async () => {
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [],
          steps: ['Fry.'],
        },
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters — no ingredients',
    ]);
  });

  it('lists recipes with unnamed ingredients', async () => {
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
        {
          id: 'tahini-halva-brownies',
          course: 'dessert',
          name: 'Tahini and Halva Brownies',
          description: null,
          pictureUri: '/images/tahini-halva-brownies.svg',
          ingredients: [{ name: 'butter' }, { name: '' }, { name: ' ' }],
          steps: ['Bake.'],
        },
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies — 2 unnamed ingredient(s)',
    ]);
  });

  it('only lists incomplete recipes', async () => {
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
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
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters — no ingredients',
    ]);
  });
});

function mountAdminMissingIngredients({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminMissingIngredients);

  return { fixture };
}

function rowTexts(root: HTMLElement): string[] {
  return [
    ...root.querySelectorAll('[data-testid="missing-ingredients-row"]'),
  ].map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
