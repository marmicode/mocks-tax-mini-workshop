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
import { AdminImport } from './admin-import.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const updatedShakshuka = recipeMother
  .withBasicInfo({
    name: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato sauce.',
  })
  .build();

const brownies = recipeMother
  .withBasicInfo('Tahini and Halva Brownies')
  .build();

describe(AdminImport, () => {
  it('does not touch the catalog before importing', async () => {
    const { recipeRepositoryFake } = mountAdminImport();

    await page.getByLabelText('Recipes JSON').fill(JSON.stringify([brownies]));

    await expect
      .element(page.getByTestId('import-ready'))
      .toHaveTextContent('1 valid recipe(s) ready to import');
    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka]);
  });

  it('rejects invalid JSON', async () => {
    mountAdminImport();

    await page.getByLabelText('Recipes JSON').fill('[{');

    await expect
      .element(page.getByTestId('import-error'))
      .toHaveTextContent('Invalid JSON.');
  });

  it('rejects recipes with an unknown course', async () => {
    mountAdminImport();

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([brownies, { ...shakshuka, course: 'brunch' }]));

    await expect
      .element(page.getByTestId('import-error'))
      .toMatchTextContent('Recipe #2 is invalid');
  });

  it('creates new recipes and updates existing ones', async () => {
    const { recipeRepositoryFake } = mountAdminImport();

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([updatedShakshuka, brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([updatedShakshuka, brownies]);
  });

  it('shows how many recipes were created and updated', async () => {
    mountAdminImport();

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([updatedShakshuka, brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect
      .element(page.getByTestId('import-summary'))
      .toHaveTextContent('1 created, 1 updated');
  });

  it('creates every recipe when the catalog is empty', async () => {
    const { recipeRepositoryFake } = mountAdminImport({
      recipes: [],
    });

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([updatedShakshuka, brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([updatedShakshuka, brownies]);
    await expect
      .element(page.getByTestId('import-summary'))
      .toHaveTextContent('2 created, 0 updated');
  });

  it('updates every recipe that already exists', async () => {
    const { recipeRepositoryFake } = mountAdminImport({
      recipes: [shakshuka, brownies],
    });

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([updatedShakshuka, brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([updatedShakshuka, brownies]);
    await expect
      .element(page.getByTestId('import-summary'))
      .toHaveTextContent('0 created, 2 updated');
  });

  it('hides the summary once the JSON is edited again', async () => {
    mountAdminImport();

    await page.getByLabelText('Recipes JSON').fill(JSON.stringify([brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();
    await expect.element(page.getByTestId('import-summary')).toBeVisible();
    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([shakshuka, brownies]));

    await expect
      .element(page.getByTestId('import-ready'))
      .toHaveTextContent('2 valid recipe(s) ready to import');
    await expect
      .element(page.getByTestId('import-summary'))
      .not.toBeInTheDocument();
  });

  it('imports recipes from a picked file', async () => {
    const { recipeRepositoryFake } = mountAdminImport();

    await page.getByLabelText('Recipes file').upload(
      new File([JSON.stringify([brownies])], 'recipes.json', {
        type: 'application/json',
      }),
    );
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([shakshuka, brownies]);
  });
});

function mountAdminImport({
  recipes = [shakshuka],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);

  TestBed.createComponent(AdminImport);

  return { recipeRepositoryFake };
}
