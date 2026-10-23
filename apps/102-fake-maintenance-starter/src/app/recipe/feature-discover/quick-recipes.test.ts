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
import { QuickRecipes } from './quick-recipes.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .withManyIngredients()
  .build();

const stew = recipeMother
  .withBasicInfo('Slow-cooked Lamb Stew')
  .withManySteps()
  .build();

describe(QuickRecipes.name, () => {
  it('searches recipes with few steps', async () => {
    const { fixture } = mountQuickRecipes();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('shows the quick recipes', async () => {
    const { fixture } = mountQuickRecipes({ recipes: [hummus, salad] });
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

  it('shows the recipes with few ingredients once capped', async () => {
    const { fixture } = mountQuickRecipes();
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
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
