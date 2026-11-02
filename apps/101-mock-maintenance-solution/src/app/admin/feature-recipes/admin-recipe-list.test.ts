import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeList } from './admin-recipe-list.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
  steps: ['Cook the sauce.', 'Poach the eggs.', 'Serve.'],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [{ name: 'ricotta' }],
  steps: ['Bake.'],
};

const catalog = [shakshuka, cheesecake];

describe(AdminRecipeList, () => {
  it('lists all recipes on load', async () => {
    const { search } = mountAdminRecipeList();

    await expect.poll(() => recipeRows()).toEqual([
      ['Shakshuka', 'main', '2', '3'],
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('searches by keywords', async () => {
    const { search } = mountAdminRecipeList();

    await expect.poll(() => search).toHaveBeenCalledOnce();
    await page.getByLabelText('Keywords').fill('lemon');

    await expect.poll(() => recipeRows()).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
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
        [
          {
            "courses": [],
            "keywords": "lemon",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('searches by course', async () => {
    const { search } = mountAdminRecipeList();

    await expect.poll(() => search).toHaveBeenCalledOnce();
    await page.getByLabelText('Course').selectOptions('dessert');

    await expect.poll(() => recipeRows()).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('stops filtering by course when "All courses" is selected', async () => {
    const { search } = mountAdminRecipeList();

    await expect.poll(() => search).toHaveBeenCalledOnce();
    await page.getByLabelText('Course').selectOptions('dessert');
    await expect.poll(() => search).toHaveBeenCalledTimes(2);
    await page.getByLabelText('Course').selectOptions('');

    await expect.poll(() => recipeRows()).toEqual([
      ['Shakshuka', 'main', '2', '3'],
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ courses: [] }),
    );
  });

  it('links to the edit and delete pages of each recipe', async () => {
    const { search } = mountAdminRecipeList();
    search.mockImplementation(
      respondBySearchKey({
        [searchKey({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: null,
          courses: [],
        })]: [shakshuka],
      }),
    );

    await expect
      .element(page.getByRole('link', { name: 'Edit' }))
      .toBeVisible();
    expect(
      page.getByRole('link', { name: 'Edit' }).element().getAttribute('href'),
    ).toBe('/admin/recipes/shakshuka/edit');
    expect(
      page.getByRole('link', { name: 'Delete' }).element().getAttribute('href'),
    ).toBe('/admin/recipes/shakshuka/delete');
    expect(
      page
        .getByRole('link', { name: 'New recipe' })
        .element()
        .getAttribute('href'),
    ).toBe('/admin/recipes/new');
  });

  it('shows "No recipes found" when nothing matches', async () => {
    const { search } = mountAdminRecipeList();

    await expect.poll(() => search).toHaveBeenCalledOnce();
    await page.getByLabelText('Keywords').fill('xyz');

    await expect.element(page.getByText('No recipes found')).toBeVisible();
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('shows the number of recipes found', async () => {
    const { search } = mountAdminRecipeList();
    search.mockImplementationOnce((params) => {
      expect(Object.keys(params)).toEqual([
        'keywords',
        'maxIngredientCount',
        'maxStepCount',
        'courses',
      ]);
      return of(catalog);
    });

    await expect.element(page.getByText('2 recipe(s)')).toBeVisible();
    expect(search).toHaveBeenCalledOnce();
  });

  it('renders the recipes matching the keywords', async () => {
    const { search } = mountAdminRecipeList();

    await expect.poll(() => search).toHaveBeenCalledOnce();
    await page.getByLabelText('Keywords').fill('ricotta');

    await expect.poll(() => recipeRows()).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot('./__snapshots__/admin-recipe-list.calls.json');
  });

  it('combines keywords and course', async () => {
    const { search } = mountAdminRecipeList();

    await expect.poll(() => search).toHaveBeenCalledOnce();
    await page.getByLabelText('Keywords').fill('shak');
    await expect.poll(() => search).toHaveBeenCalledTimes(2);
    await page.getByLabelText('Course').selectOptions('main');

    await expect
      .poll(() => recipeRows())
      .toEqual([['Shakshuka', 'main', '2', '3']]);
    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenNthCalledWith(3, {
      keywords: 'shak',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('keeps keywords when "All courses" is selected again', async () => {
    const { search } = mountAdminRecipeList();

    await expect.poll(() => search).toHaveBeenCalledOnce();
    await page.getByLabelText('Course').selectOptions('starter');
    await expect.poll(() => search).toHaveBeenCalledTimes(2);
    await page.getByLabelText('Keywords').fill('hummus');
    await expect.poll(() => search).toHaveBeenCalledTimes(3);
    await page.getByLabelText('Course').selectOptions('');

    await expect.poll(() => search).toHaveBeenCalledTimes(4);
    expect(search.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "courses": [],
          "keywords": "hummus",
          "maxIngredientCount": null,
          "maxStepCount": null,
        },
      ]
    `);
  });
});

function mountAdminRecipeList() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) => {
      const recipes =
        params.courses.length > 0
          ? catalog.filter((recipe) => params.courses?.includes(recipe.course))
          : catalog;
      return of(
        recipes.filter((recipe) =>
          recipe.name.toLowerCase().includes(params.keywords.toLowerCase()),
        ),
      );
    });
  TestBed.createComponent(AdminRecipeList);
  return { search };
}

function respondBySearchKey(responses: Record<string, Recipe[]>) {
  return (params: RecipeSearchParams) => {
    const key = searchKey(params);
    return key in responses
      ? of(responses[key])
      : throwError(() => new Error(`unexpected search ${key}`));
  };
}

function searchKey(params: RecipeSearchParams): string {
  return JSON.stringify(params);
}

function recipeRows() {
  return page
    .getByTestId('recipe-row')
    .all()
    .map((row) =>
      row
        .getByRole('cell')
        .elements()
        .slice(0, 4)
        .map((cell) => cell.textContent?.trim() ?? ''),
    );
}
