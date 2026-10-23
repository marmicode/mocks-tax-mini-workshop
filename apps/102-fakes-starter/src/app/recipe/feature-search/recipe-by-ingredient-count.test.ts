import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { RecipeByIngredientCount } from './recipe-by-ingredient-count.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
  steps: [],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: 'eggs' },
    { name: 'tomatoes' },
    { name: 'peppers' },
    { name: 'onion' },
  ],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [
    { name: 'ricotta' },
    { name: 'eggs' },
    { name: 'sugar' },
    { name: 'lemons' },
    { name: 'flour' },
    { name: 'butter' },
    { name: 'vanilla' },
  ],
  steps: [],
};

describe(RecipeByIngredientCount.name, () => {
  it('shows recipes with at most 5 ingredients by default', async () => {
    const { fixture } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
    ]);
  });

  it('counts the matching recipes', async () => {
    const { fixture } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    expect(recipeCount(fixture.nativeElement)).toBe(
      '2 recipes with at most 5 ingredients',
    );
  });

  it('shows fewer recipes when asked for fewer ingredients', async () => {
    const { fixture } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'At most 3 ingredients').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
    expect(recipeCount(fixture.nativeElement)).toBe(
      '1 recipes with at most 3 ingredients',
    );
  });

  it('shows more recipes when asked for more ingredients', async () => {
    const { fixture } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'At most 8 ingredients').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
    expect(recipeCount(fixture.nativeElement)).toBe(
      '3 recipes with at most 8 ingredients',
    );
  });

  it('counts zero recipes when none matches', async () => {
    const { fixture } = mountRecipeByIngredientCount({
      recipes: [cheesecake],
    });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(recipeCount(fixture.nativeElement)).toBe(
      '0 recipes with at most 5 ingredients',
    );
  });
});

function mountRecipeByIngredientCount({
  recipes = [hummus, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(RecipeByIngredientCount);

  return { fixture };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function recipeCount(root: HTMLElement): string | undefined {
  return root
    .querySelector('[data-testid="recipe-count"]')
    ?.textContent?.replace(/\s+/g, ' ')
    .trim();
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
