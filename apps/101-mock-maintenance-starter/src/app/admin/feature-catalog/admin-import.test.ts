import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminImport } from './admin-import.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const updatedShakshuka: Recipe = {
  ...shakshuka,
  description: 'Eggs poached in a spiced tomato sauce.',
};

const brownies: Recipe = {
  id: 'tahini-halva-brownies',
  course: 'dessert',
  name: 'Tahini and Halva Brownies',
  description: null,
  pictureUri: '/images/tahini-halva-brownies.svg',
  ingredients: [{ name: 'tahini', quantity: { amount: 80, unit: 'g' } }],
  steps: ['Bake.'],
};

describe(AdminImport, () => {
  it('does not search recipes before importing', async () => {
    const { search } = mountAdminImport();

    await page.getByLabelText('Recipes JSON').fill(JSON.stringify([brownies]));

    await expect
      .element(page.getByTestId('import-ready'))
      .toHaveTextContent('1 valid recipe(s) ready to import');
    expect(search).not.toHaveBeenCalled();
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
    const { search, create, update } = mountAdminImport();
    search.mockImplementation((params) =>
      of(isWholeCatalogSearch(params) ? [shakshuka] : []),
    );

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([updatedShakshuka, brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect.poll(() => update).toHaveBeenCalledExactlyOnceWith({
      id: 'shakshuka',
      course: 'main',
      name: 'Shakshuka',
      description: 'Eggs poached in a spiced tomato sauce.',
      pictureUri: 'https://example.com/shakshuka.jpg',
      ingredients: [],
      steps: [],
    });
    expect(create).toHaveBeenCalledExactlyOnceWith({
      id: 'tahini-halva-brownies',
      course: 'dessert',
      name: 'Tahini and Halva Brownies',
      description: null,
      pictureUri: '/images/tahini-halva-brownies.svg',
      ingredients: [{ name: 'tahini', quantity: { amount: 80, unit: 'g' } }],
      steps: ['Bake.'],
    });
  });

  it('shows how many recipes were created and updated', async () => {
    const { search } = mountAdminImport();

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([updatedShakshuka, brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect
      .element(page.getByTestId('import-summary'))
      .toHaveTextContent('1 created, 1 updated');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('creates every recipe when the catalog is empty', async () => {
    const { search, create, update } = mountAdminImport();
    search.mockImplementation((params) => {
      expect(Object.keys(params).sort()).toEqual([
        'keywords',
        'maxIngredientCount',
        'maxStepCount',
      ]);
      return of([]);
    });

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([updatedShakshuka, brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect
      .element(page.getByTestId('import-summary'))
      .toHaveTextContent('2 created, 0 updated');
    expect(create).toHaveBeenCalledTimes(2);
    expect(update).not.toHaveBeenCalled();
  });

  it('updates every recipe that already exists', async () => {
    const { search, create, update } = mountAdminImport();
    const existingRecipesBySearch: Record<string, Recipe[]> = {
      '{"keywords":"","maxIngredientCount":null,"maxStepCount":null}': [
        shakshuka,
        brownies,
      ],
    };
    search.mockImplementation((params) =>
      of(existingRecipesBySearch[JSON.stringify(params)] ?? []),
    );

    await page
      .getByLabelText('Recipes JSON')
      .fill(JSON.stringify([updatedShakshuka, brownies]));
    await expect.element(page.getByTestId('import-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Import' }).click();

    await expect
      .element(page.getByTestId('import-summary'))
      .toHaveTextContent('0 created, 2 updated');
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('hides the summary once the JSON is edited again', async () => {
    const { search } = mountAdminImport();

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
    expect(page.getByTestId('import-summary').query()).toBeNull();
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('imports recipes from a picked file', async () => {
    const { search, create } = mountAdminImport();

    await page.getByLabelText('Recipes file').upload(
      new File([JSON.stringify([brownies])], 'recipes.json', {
        type: 'application/json',
      }),
    );
    await expect
      .element(page.getByTestId('import-ready'))
      .toHaveTextContent('1 valid recipe(s) ready to import');
    await page.getByRole('button', { name: 'Import' }).click();

    await expect.poll(() => create).toHaveBeenCalledExactlyOnceWith({
      id: 'tahini-halva-brownies',
      course: 'dessert',
      name: 'Tahini and Halva Brownies',
      description: null,
      pictureUri: '/images/tahini-halva-brownies.svg',
      ingredients: [{ name: 'tahini', quantity: { amount: 80, unit: 'g' } }],
      steps: ['Bake.'],
    });
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });
});

function mountAdminImport() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const search = vi
    .spyOn(recipeRepository, 'search')
    .mockReturnValue(of([shakshuka]));
  const create = vi
    .spyOn(recipeRepository, 'create')
    .mockImplementation((recipe) => of(recipe));
  const update = vi
    .spyOn(recipeRepository, 'update')
    .mockImplementation((recipe) => of(recipe));

  TestBed.createComponent(AdminImport);

  return { search, create, update };
}

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    Object.keys(params).length === 3 &&
    Object.values(params).every((value) => value === '' || value === null)
  );
}
