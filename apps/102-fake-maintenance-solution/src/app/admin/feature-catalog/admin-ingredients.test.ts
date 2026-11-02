import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminIngredients } from './admin-ingredients.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: 'Olive oil', quantity: { amount: 3, unit: 'tbsp' } },
    { name: 'eggs' },
  ])
  .build();

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([{ name: 'olive oil' }, { name: 'tahini' }])
  .build();

describe(AdminIngredients, () => {
  it('searches all recipes', async () => {
    mountAdminIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withIngredients([{ name: 'olive oil' }])
          .build(),
        /* The pantry of withManyIngredients() includes olive oil too. */
        recipeMother
          .withBasicInfo('Slow-Roasted Lamb Shoulder')
          .withManyIngredients()
          .build(),
        recipeMother
          .withBasicInfo('Lamb Kofte')
          .withManySteps()
          .withIngredients([{ name: 'olive oil' }])
          .build(),
      ],
    });

    await expect
      .poll(() => ingredientRows())
      .toContainEqual(['olive oil', '3']);
  });

  it('counts how many recipes use each ingredient', async () => {
    mountAdminIngredients();

    await expect
      .poll(() => ingredientRows())
      .toEqual([
        ['olive oil', '2'],
        ['eggs', '1'],
        ['tahini', '1'],
      ]);
  });

  it('renames an ingredient in every recipe using it', async () => {
    const { recipeRepositoryFake } = mountAdminIngredients();

    await renameIngredient('olive oil', 'extra virgin olive oil');

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([
        recipeMother
          .withBasicInfo('Shakshuka')
          .withIngredients([
            {
              name: 'extra virgin olive oil',
              quantity: { amount: 3, unit: 'tbsp' },
            },
            { name: 'eggs' },
          ])
          .build(),
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withIngredients([
            { name: 'extra virgin olive oil' },
            { name: 'tahini' },
          ])
          .build(),
      ]);
  });

  it('searches recipes again after renaming', async () => {
    const { recipeRepositoryFake } = mountAdminIngredients();
    await expect.element(page.getByTestId('ingredient-row').first()).toBeVisible();

    recipeRepositoryFake.setRecipes([
      shakshuka,
      hummus,
      recipeMother
        .withBasicInfo('Lamb Kofte')
        .withIngredients([{ name: 'cumin' }])
        .build(),
    ]);
    await renameIngredient('tahini', 'light tahini');

    await expect
      .poll(() => ingredientRows())
      .toEqual([
        ['olive oil', '2'],
        ['cumin', '1'],
        ['eggs', '1'],
        ['light tahini', '1'],
      ]);
  });

  it('does not update anything when the name is unchanged', async () => {
    const { recipeRepositoryFake } = mountAdminIngredients();

    await renameIngredient('eggs', 'eggs');

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka, hummus]);
  });

  it('counts an ingredient once per recipe', async () => {
    mountAdminIngredients({
      recipes: [
        {
          ...shakshuka,
          ingredients: [{ name: 'Eggs' }, { name: ' eggs ' }],
        },
      ],
    });

    await expect.poll(() => ingredientRows()).toEqual([['eggs', '1']]);
  });

  it('does not update anything when the new name is blank', async () => {
    const { recipeRepositoryFake } = mountAdminIngredients();

    await renameIngredient('tahini', '   ');

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka, hummus]);
  });

  it('cancels renaming', async () => {
    const { recipeRepositoryFake } = mountAdminIngredients();

    await ingredientRow('olive oil')
      .getByRole('button', { name: 'Rename' })
      .click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect
      .element(
        ingredientRow('olive oil').getByRole('button', { name: 'Rename' }),
      )
      .toBeVisible();
    await expect
      .element(page.getByLabelText('New name for olive oil'))
      .not.toBeInTheDocument();
    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka, hummus]);
  });

  it('shows the renamed ingredient once recipes are searched again', async () => {
    mountAdminIngredients();

    await renameIngredient('tahini', 'tahina');

    await expect
      .poll(() => ingredientRows())
      .toEqual([
        ['olive oil', '2'],
        ['eggs', '1'],
        ['tahina', '1'],
      ]);
    await expect
      .element(page.getByRole('button', { name: 'Rename' }))
      .toHaveLength(3);
    await expect.element(page.getByRole('textbox')).not.toBeInTheDocument();
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

  TestBed.createComponent(AdminIngredients);

  return { recipeRepositoryFake };
}

function ingredientRows() {
  const names = page
    .getByTestId('ingredient-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
  const counts = page
    .getByTestId('ingredient-count')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
  return names.map((name, index) => [name, counts[index]]);
}

function ingredientRow(name: string) {
  return page.getByTestId('ingredient-row').filter({
    has: page.getByText(name, { exact: true }),
  });
}

async function renameIngredient(name: string, newName: string) {
  const row = ingredientRow(name);
  await row.getByRole('button', { name: 'Rename' }).click();
  await row.getByLabelText(`New name for ${name}`).fill(newName);
  await row.getByRole('button', { name: 'Save' }).click();
}
