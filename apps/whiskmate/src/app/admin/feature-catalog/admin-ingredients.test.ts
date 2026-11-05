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

describe(AdminIngredients, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminIngredients();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('counts how many recipes use each ingredient', async () => {
    const { search } = mountAdminIngredients();
    search.mockImplementation(({ courses }) =>
      of(
        courses.length > 0
          ? [shakshuka, hummus].filter((recipe) =>
              courses.includes(recipe.course),
            )
          : [shakshuka, hummus],
      ),
    );

    await expect
      .poll(() => ingredientRows())
      .toEqual([
        ['olive oil', '2'],
        ['eggs', '1'],
        ['tahini', '1'],
      ]);
  });

  it('renames an ingredient in every recipe using it', async () => {
    const { update } = mountAdminIngredients();

    await renameIngredient('olive oil', 'extra virgin olive oil');

    await expect.poll(() => update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenNthCalledWith(1, {
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
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      id: 'hummus-ful',
      course: 'starter',
      name: 'Hummus with Ful',
      description: null,
      pictureUri: 'https://example.com/hummus.jpg',
      ingredients: [{ name: 'extra virgin olive oil' }, { name: 'tahini' }],
      steps: [],
    });
  });

  it('searches recipes again after renaming', async () => {
    const { search } = mountAdminIngredients();

    await renameIngredient('tahini', 'light tahini');

    await expect.poll(() => search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('does not update anything when the name is unchanged', async () => {
    const { update } = mountAdminIngredients();

    await renameIngredient('eggs', 'eggs');

    await expect
      .element(ingredientRow('eggs').getByRole('button', { name: 'Rename' }))
      .toBeVisible();
    expect(update).not.toHaveBeenCalled();
  });

  it('counts an ingredient once per recipe', async () => {
    const { search } = mountAdminIngredients();
    const recipesBySearch = new Map<string, Recipe[]>([
      [
        JSON.stringify({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: null,
          courses: [],
        }),
        [
          {
            ...shakshuka,
            ingredients: [{ name: 'Eggs' }, { name: ' eggs ' }],
          },
        ],
      ],
    ]);
    search.mockImplementation((params) => {
      const recipes = recipesBySearch.get(JSON.stringify(params));
      if (recipes === undefined) {
        throw new Error(`unexpected search ${JSON.stringify(params)}`);
      }
      return of(recipes);
    });

    await expect.poll(() => ingredientRows()).toEqual([['eggs', '1']]);
  });

  it('does not update anything when the new name is blank', async () => {
    const { search, update } = mountAdminIngredients();

    await renameIngredient('tahini', '   ');

    await expect
      .element(ingredientRow('tahini').getByRole('button', { name: 'Rename' }))
      .toBeVisible();
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('cancels renaming', async () => {
    const { search, update } = mountAdminIngredients();
    const row = ingredientRow('olive oil');

    await row.getByRole('button', { name: 'Rename' }).click();
    await row.getByRole('button', { name: 'Cancel' }).click();

    await expect
      .element(row.getByRole('button', { name: 'Rename' }))
      .toBeVisible();
    expect(page.getByRole('textbox').query()).toBeNull();
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
    expect(update).not.toHaveBeenCalled();
  });

  it('shows the renamed ingredient once recipes are searched again', async () => {
    const { search } = mountAdminIngredients();

    await expect.poll(() => search).toHaveBeenCalledOnce();
    search.mockImplementationOnce((params) =>
      isWholeCatalogSearch(params)
        ? of([
            shakshuka,
            {
              ...hummus,
              ingredients: [{ name: 'olive oil' }, { name: 'tahina' }],
            },
          ])
        : of([]),
    );
    await renameIngredient('tahini', 'tahina');

    await expect
      .poll(() => ingredientRows())
      .toEqual([
        ['olive oil', '2'],
        ['eggs', '1'],
        ['tahina', '1'],
      ]);
    expect(page.getByRole('textbox').query()).toBeNull();
  });
});

function mountAdminIngredients() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const search = vi
    .spyOn(recipeRepository, 'search')
    .mockReturnValue(of([shakshuka, hummus]));
  const update = vi
    .spyOn(recipeRepository, 'update')
    .mockImplementation((recipe) => of(recipe));

  TestBed.createComponent(AdminIngredients);

  return { search, update };
}

function ingredientRows() {
  return page
    .getByTestId('ingredient-row')
    .all()
    .map((row) => [
      row.getByTestId('ingredient-name').element().textContent?.trim() ?? '',
      row.getByTestId('ingredient-count').element().textContent?.trim() ?? '',
    ]);
}

function ingredientRow(name: string) {
  return page.getByTestId('ingredient-row').filter({ hasText: name });
}

async function renameIngredient(name: string, newName: string) {
  const row = ingredientRow(name);
  await row.getByRole('button', { name: 'Rename' }).click();
  await row.getByLabelText(`New name for ${name}`).fill(newName);
  await row.getByRole('button', { name: 'Save' }).click();
}

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    params.keywords === '' &&
    params.maxIngredientCount === null &&
    params.maxStepCount === null &&
    params.courses.length === 0
  );
}
