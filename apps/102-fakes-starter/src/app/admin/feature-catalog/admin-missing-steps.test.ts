import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminMissingSteps } from './admin-missing-steps.ng';

describe(AdminMissingSteps.name, () => {
  it('shows an empty state when every recipe has steps', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: 'Eggs poached in a spiced tomato sauce.',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }],
          steps: ['Cook the sauce.', 'Crack the eggs.'],
        },
      ],
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe('Every recipe has steps.');
  });

  it('lists recipes without any step', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [{ name: 'chickpeas' }],
          steps: [],
        },
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('lists recipes with only blank steps', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }],
          steps: ['', '  '],
        },
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters (2 blank)',
    ]);
  });

  it('ignores recipes with at least one real step', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
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
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });
});

function mountAdminMissingSteps({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminMissingSteps);

  return { fixture };
}

function rowTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="missing-steps-row"]')].map(
    (row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
