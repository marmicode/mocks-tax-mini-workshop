import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminIngredients } from './admin-ingredients.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: 'Olive oil', quantity: { amount: 3, unit: 'tbsp' } },
    { name: 'eggs' },
  ],
  steps: [],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'olive oil' }, { name: 'tahini' }],
  steps: [],
};

describe(AdminIngredients.name, () => {
  it('counts how many recipes use each ingredient', async () => {
    const { fixture } = mountAdminIngredients();
    await fixture.whenStable();

    expect(ingredientRows(fixture.nativeElement)).toEqual([
      ['olive oil', '2'],
      ['eggs', '1'],
      ['tahini', '1'],
    ]);
  });

  it('renames an ingredient in every recipe using it', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminIngredients();
    await fixture.whenStable();

    await renameIngredient(fixture, 'olive oil', 'extra virgin olive oil');
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([
      {
        id: 'shakshuka',
        course: 'main',
        name: 'Shakshuka',
        description: null,
        pictureUri: 'https://example.com/shakshuka.jpg',
        ingredients: [
          {
            name: 'extra virgin olive oil',
            quantity: { amount: 3, unit: 'tbsp' },
          },
          { name: 'eggs' },
        ],
        steps: [],
      },
      {
        id: 'hummus-ful',
        course: 'starter',
        name: 'Hummus with Ful',
        description: null,
        pictureUri: 'https://example.com/hummus.jpg',
        ingredients: [{ name: 'extra virgin olive oil' }, { name: 'tahini' }],
        steps: [],
      },
    ]);
  });

  it('shows the renamed ingredient after renaming', async () => {
    const { fixture } = mountAdminIngredients();
    await fixture.whenStable();

    await renameIngredient(fixture, 'tahini', 'light tahini');
    await fixture.whenStable();

    expect(ingredientRows(fixture.nativeElement)).toEqual([
      ['olive oil', '2'],
      ['eggs', '1'],
      ['light tahini', '1'],
    ]);
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });

  it('does not update anything when the name is unchanged', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminIngredients();
    await fixture.whenStable();

    await renameIngredient(fixture, 'eggs', 'eggs');
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka, hummus]);
  });

  it('counts an ingredient once per recipe', async () => {
    const { fixture } = mountAdminIngredients({
      recipes: [
        {
          ...shakshuka,
          ingredients: [{ name: 'Eggs' }, { name: ' eggs ' }],
        },
      ],
    });
    await fixture.whenStable();

    expect(ingredientRows(fixture.nativeElement)).toEqual([['eggs', '1']]);
  });

  it('does not update anything when the new name is blank', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminIngredients();
    await fixture.whenStable();

    await renameIngredient(fixture, 'tahini', '   ');
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka, hummus]);
  });

  it('cancels renaming', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminIngredients();
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Rename').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Cancel').click();
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka, hummus]);
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });
});

function mountAdminIngredients({
  recipes = [shakshuka, hummus],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminIngredients);

  return { fixture, recipeRepositoryFake };
}

function ingredientRows(root: HTMLElement): string[][] {
  return [...root.querySelectorAll('[data-testid="ingredient-row"]')].map(
    (row) => [
      row
        .querySelector('[data-testid="ingredient-name"]')
        ?.textContent?.trim() ?? '',
      row
        .querySelector('[data-testid="ingredient-count"]')
        ?.textContent?.trim() ?? '',
    ],
  );
}

async function renameIngredient(
  fixture: ComponentFixture<AdminIngredients>,
  name: string,
  newName: string,
) {
  const row = [
    ...fixture.nativeElement.querySelectorAll('[data-testid="ingredient-row"]'),
  ].find(
    (el) =>
      el
        .querySelector('[data-testid="ingredient-name"]')
        ?.textContent?.trim() === name,
  );
  buttonByText(row, 'Rename').click();
  await fixture.whenStable();
  const input = row?.querySelector('input');
  if (input == null) {
    throw new Error(`Rename input for "${name}" not found.`);
  }
  input.value = newName;
  buttonByText(row, 'Save').click();
}

function buttonByText(
  root: Element | undefined,
  text: string,
): HTMLButtonElement {
  const button = [...(root?.querySelectorAll('button') ?? [])].find(
    (el) => el.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
