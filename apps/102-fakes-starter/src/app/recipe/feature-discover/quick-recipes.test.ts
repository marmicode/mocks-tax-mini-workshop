import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { QuickRecipes } from './quick-recipes.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }, { name: 'ful' }],
  steps: ['Blend the chickpeas.', 'Warm the ful.', 'Serve.'],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [
    { name: 'aubergines' },
    { name: 'tahini' },
    { name: 'pomegranate' },
    { name: 'lemon' },
    { name: 'garlic' },
    { name: 'parsley' },
    { name: 'olive oil' },
  ],
  steps: ['Burn the aubergines.', 'Dress with tahini.'],
};

const stew: Recipe = {
  id: 'lamb-stew',
  course: 'main',
  name: 'Slow-cooked Lamb Stew',
  description: null,
  pictureUri: 'https://example.com/stew.jpg',
  ingredients: [{ name: 'lamb' }, { name: 'onions' }],
  steps: [
    'Marinate.',
    'Sear.',
    'Sweat the onions.',
    'Deglaze.',
    'Simmer.',
    'Rest.',
  ],
};

describe(QuickRecipes.name, () => {
  it('shows only recipes with few steps', async () => {
    const { fixture } = mountQuickRecipes();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('also caps ingredients when asked', async () => {
    const { fixture } = mountQuickRecipes();
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('stops capping ingredients once unchecked', async () => {
    const { fixture } = mountQuickRecipes();
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();
    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('shows a message when there are no quick recipes', async () => {
    const { fixture } = mountQuickRecipes({ recipes: [stew] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No quick recipes found');
  });

  it('mentions the step cap', async () => {
    const { fixture } = mountQuickRecipes();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'Recipes with at most 5 steps.',
    );
  });

  it('shows a message when no quick recipe has few ingredients', async () => {
    const { fixture } = mountQuickRecipes({ recipes: [salad, stew] });
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No quick recipes found');
  });
});

function mountQuickRecipes({
  recipes = [hummus, salad, stew],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(QuickRecipes);

  return { fixture };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function checkboxByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const checkbox = [...root.querySelectorAll('mat-checkbox')].find(
    (el) => el.textContent?.trim() === label,
  );
  const input = checkbox?.querySelector('input');
  if (input == null) {
    throw new Error(`Checkbox "${label}" not found.`);
  }
  return input;
}
