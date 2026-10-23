import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { IngredientIndex } from './ingredient-index.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: '2 red peppers, sliced' },
    { name: 'garlic, crushed', quantity: { amount: 4, unit: 'cloves' } },
    { name: '800g tinned chopped tomatoes' },
  ],
  steps: [],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [
    { name: 'tahini', quantity: { amount: 4, unit: 'tbsp' } },
    { name: 'garlic', quantity: { amount: 1, unit: 'clove' } },
  ],
  steps: [],
};

describe(IngredientIndex.name, () => {
  it('lists normalized ingredient names alphabetically', async () => {
    const { fixture } = mountIngredientIndex();
    await fixture.whenStable();

    expect(ingredientNames(fixture.nativeElement)).toEqual([
      'garlic',
      'red peppers',
      'tahini',
      'tinned chopped tomatoes',
    ]);
  });

  it('groups ingredients by first letter', async () => {
    const { fixture } = mountIngredientIndex();
    await fixture.whenStable();

    expect(sectionLetters(fixture.nativeElement)).toEqual(['g', 'r', 't']);
  });

  it('lists every recipe using an ingredient', async () => {
    const { fixture } = mountIngredientIndex();
    await fixture.whenStable();

    expect(recipeNamesFor(fixture.nativeElement, 'garlic')).toEqual([
      'Shakshuka',
      'Hummus with Ful',
    ]);
  });

  it('filters ingredients', async () => {
    const { fixture } = mountIngredientIndex();
    await fixture.whenStable();

    typeInto(fixture.nativeElement.querySelector('input'), 'ta');
    await fixture.whenStable();

    expect(ingredientNames(fixture.nativeElement)).toEqual(['tahini']);
  });

  it('shows a message when no ingredient matches', async () => {
    const { fixture } = mountIngredientIndex();
    await fixture.whenStable();

    typeInto(fixture.nativeElement.querySelector('input'), 'saffron');
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-ingredients-message"]',
      )?.textContent,
    ).toContain('No ingredients found.');
  });

  it('filters ingredients ignoring case and surrounding spaces', async () => {
    const { fixture } = mountIngredientIndex();
    await fixture.whenStable();

    typeInto(fixture.nativeElement.querySelector('input'), '  GAR ');
    await fixture.whenStable();

    expect(ingredientNames(fixture.nativeElement)).toEqual(['garlic']);
  });

  it('lists a recipe only once when it uses an ingredient twice', async () => {
    const { fixture } = mountIngredientIndex({
      recipes: [
        {
          ...hummus,
          ingredients: [
            { name: 'garlic, crushed' },
            { name: '2 garlic, roasted' },
          ],
        },
      ],
    });
    await fixture.whenStable();

    expect(ingredientNames(fixture.nativeElement)).toEqual(['garlic']);
    expect(recipeNamesFor(fixture.nativeElement, 'garlic')).toEqual([
      'Hummus with Ful',
    ]);
  });

  it('links each recipe to its detail page', async () => {
    const { fixture } = mountIngredientIndex();
    await fixture.whenStable();

    expect(recipeLinksFor(fixture.nativeElement, 'tahini')).toEqual([
      '/recipes/hummus-ful',
    ]);
  });

  it('shows a message when the catalog is empty', async () => {
    const { fixture } = mountIngredientIndex({ recipes: [] });
    await fixture.whenStable();

    expect(sectionLetters(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-ingredients-message"]',
      )?.textContent,
    ).toContain('No ingredients found.');
  });
});

function mountIngredientIndex({
  recipes = [shakshuka, hummus],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(IngredientIndex);

  return { fixture };
}

function entries(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-testid="index-entry"]')];
}

function ingredientNames(root: HTMLElement): string[] {
  return entries(root).map(
    (entry) => entry.querySelector('dt')?.textContent?.trim() ?? '',
  );
}

function sectionLetters(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="index-section"] h3')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function recipeNamesFor(root: HTMLElement, ingredient: string): string[] {
  const entry = entries(root).find(
    (el) => el.querySelector('dt')?.textContent?.trim() === ingredient,
  );
  return [...(entry?.querySelectorAll('dd a') ?? [])].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function recipeLinksFor(root: HTMLElement, ingredient: string): string[] {
  const entry = entries(root).find(
    (el) => el.querySelector('dt')?.textContent?.trim() === ingredient,
  );
  return [...(entry?.querySelectorAll('dd a') ?? [])].map(
    (el) => el.getAttribute('href') ?? '',
  );
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}
