import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { RecipeByIngredientCount } from './recipe-by-ingredient-count.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

/* Between the "at most 3" and "at most 5" buttons. */
const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: 'eggs' },
    { name: 'tomatoes' },
    { name: 'peppers' },
    { name: 'onion' },
  ])
  .build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .withManyIngredients()
  .build();

describe(RecipeByIngredientCount.name, () => {
  it('searches recipes with at most 5 ingredients by default', async () => {
    const { fixture } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
    ]);
  });

  it('shows the matching recipes', async () => {
    const { fixture } = mountRecipeByIngredientCount({
      recipes: [hummus, shakshuka],
    });
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

  it('searches with fewer ingredients when asked', async () => {
    const { fixture } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'At most 3 ingredients').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
    expect(recipeCount(fixture.nativeElement)).toBe(
      '1 recipes with at most 3 ingredients',
    );
  });

  it('searches with more ingredients when asked', async () => {
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
