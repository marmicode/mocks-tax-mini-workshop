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
import { FiveIngredientRecipes } from './five-ingredient-recipes.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .build();

const tagine = recipeMother
  .withBasicInfo('Lamb Tagine')
  .withManyIngredients()
  .build();

describe(FiveIngredientRecipes.name, () => {
  it('shows only recipes with at most five ingredients', async () => {
    const { fixture } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('narrows the recipes with keywords', async () => {
    const { fixture } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    typeKeywords(fixture.nativeElement, 'hummus');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('shows every five-ingredient recipe again once keywords are cleared', async () => {
    const { fixture } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    typeKeywords(fixture.nativeElement, 'salad');
    await fixture.whenStable();
    typeKeywords(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('shows a message when there are no five-ingredient recipes', async () => {
    const { fixture } = mountFiveIngredientRecipes({ recipes: [tagine] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No five-ingredient recipes found');
  });
});

function mountFiveIngredientRecipes({
  recipes = [hummus, salad, tagine],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(FiveIngredientRecipes);

  return { fixture };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function typeKeywords(root: HTMLElement, keywords: string): void {
  const input = root.querySelector<HTMLInputElement>(
    '[data-testid="keywords-input"]',
  );
  if (input == null) {
    throw new Error('Keywords input not found.');
  }
  input.value = keywords;
  input.dispatchEvent(new Event('input'));
}
