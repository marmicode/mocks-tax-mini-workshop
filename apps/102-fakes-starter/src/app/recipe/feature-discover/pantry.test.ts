import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { Pantry } from './pantry.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: '2 red peppers, sliced' },
    { name: 'garlic, crushed', quantity: { amount: 4, unit: 'cloves' } },
    { name: 'large eggs', quantity: { amount: 6, unit: '' } },
  ])
  .build();

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([
    { name: 'tahini', quantity: { amount: 4, unit: 'tbsp' } },
    { name: 'garlic', quantity: { amount: 1, unit: 'clove' } },
  ])
  .build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .withIngredients([{ name: 'ricotta', quantity: { amount: 250, unit: 'g' } }])
  .build();

describe(Pantry.name, () => {
  it('searches all recipes', async () => {
    const { fixture } = mountPantry({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Baklava', course: 'dessert' })
          .withIngredients([{ name: 'garlic' }])
          .build(),
        recipeMother.withBasicInfo('Cassoulet').withManyIngredients().build(),
        recipeMother
          .withBasicInfo('Shakshuka')
          .withIngredients([{ name: 'garlic' }])
          .withManySteps()
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="pantry-hint"]'),
    ).not.toBeNull();

    addIngredient(fixture.nativeElement, 'garlic');
    await fixture.whenStable();

    expect(matchedRecipeNames(fixture.nativeElement)).toEqual([
      'Baklava',
      'Shakshuka',
      'Cassoulet',
    ]);
  });

  it('shows recipes using an ingredient I have', async () => {
    const { fixture } = mountPantry();
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'Ricotta');
    await fixture.whenStable();

    expect(matchedRecipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('ranks recipes by number of matching ingredients', async () => {
    const { fixture } = mountPantry();
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'garlic');
    addIngredient(fixture.nativeElement, 'eggs');
    await fixture.whenStable();

    expect(matchedRecipeNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Hummus with Ful',
    ]);
    expect(textsOf(fixture.nativeElement, 'match-count')).toEqual([
      '2/3 ingredients',
      '1/2 ingredients',
    ]);
  });

  it('shows missing ingredients', async () => {
    const { fixture } = mountPantry();
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'garlic');
    await fixture.whenStable();

    expect(textsOf(fixture.nativeElement, 'missing-ingredients')).toEqual([
      'Missing: tahini',
      'Missing: red peppers, large eggs',
    ]);
  });

  it('removes an ingredient', async () => {
    const { fixture } = mountPantry();
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'garlic');
    addIngredient(fixture.nativeElement, 'ricotta');
    await fixture.whenStable();
    fixture.nativeElement
      .querySelector('button[aria-label="Remove garlic"]')
      ?.click();
    await fixture.whenStable();

    expect(matchedRecipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('tells when no recipe uses my ingredients', async () => {
    const { fixture } = mountPantry();
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'saffron');
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-match-message"]')
        ?.textContent,
    ).toContain('No recipe uses these ingredients.');
  });

  it('ignores blank and duplicate ingredients', async () => {
    const { fixture } = mountPantry();
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'garlic');
    addIngredient(fixture.nativeElement, '  GARLIC ');
    addIngredient(fixture.nativeElement, '   ');
    await fixture.whenStable();

    expect(itemLabels(fixture.nativeElement)).toEqual(['Remove garlic']);
  });

  it('does not show missing ingredients when I have them all', async () => {
    const { fixture } = mountPantry();
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'ricotta');
    await fixture.whenStable();

    expect(textsOf(fixture.nativeElement, 'match-count')).toEqual([
      '1/1 ingredients',
    ]);
    expect(textsOf(fixture.nativeElement, 'missing-ingredients')).toEqual([]);
  });

  it('shows the hint again once the last ingredient is removed', async () => {
    const { fixture } = mountPantry();
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'tahini');
    await fixture.whenStable();
    fixture.nativeElement
      .querySelector('button[aria-label="Remove tahini"]')
      ?.click();
    await fixture.whenStable();

    expect(matchedRecipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="pantry-hint"]'),
    ).not.toBeNull();
  });

  it('tells when the repository returns no recipes', async () => {
    const { fixture } = mountPantry({ recipes: [] });
    await fixture.whenStable();

    addIngredient(fixture.nativeElement, 'garlic');
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-match-message"]')
        ?.textContent,
    ).toContain('No recipe uses these ingredients.');
  });
});

function mountPantry({
  recipes = [shakshuka, hummus, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(Pantry);

  return { fixture };
}

function addIngredient(root: HTMLElement, ingredient: string): void {
  const input = root.querySelector('input');
  if (input == null) {
    throw new Error('Ingredient input not found.');
  }
  input.value = ingredient;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
}

function itemLabels(root: HTMLElement): string[] {
  return [...root.querySelectorAll('.items button')].map(
    (el) => el.getAttribute('aria-label') ?? '',
  );
}

function matchedRecipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="pantry-match"] a')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function textsOf(root: HTMLElement, testId: string): string[] {
  return [...root.querySelectorAll(`[data-testid="${testId}"]`)].map(
    (el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}
