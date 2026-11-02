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
import { AdminRecipeList } from './admin-recipe-list.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withSomeIngredients()
  .withSomeSteps()
  .build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .withManyIngredients()
  .withManySteps()
  .build();

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .withSomeIngredients()
  .withSomeSteps()
  .build();

describe(AdminRecipeList, () => {
  it('lists all recipes on load', async () => {
    mountAdminRecipeList();

    await expect
      .poll(() => rows())
      .toEqual([
        ['Shakshuka', 'main', '3', '3'],
        ['Lemon and Ricotta Cheesecake', 'dessert', '8', '8'],
      ]);
  });

  it('searches by keywords', async () => {
    mountAdminRecipeList();

    await expect.element(page.getByTestId('recipe-row').first()).toBeVisible();
    await page.getByLabelText('Keywords').fill('lemon');

    await expect
      .poll(() => rows())
      .toEqual([['Lemon and Ricotta Cheesecake', 'dessert', '8', '8']]);
  });

  it('searches by course', async () => {
    mountAdminRecipeList();

    await expect.element(page.getByTestId('recipe-row').first()).toBeVisible();
    await page.getByLabelText('Course').selectOptions('dessert');

    await expect
      .poll(() => rows())
      .toEqual([['Lemon and Ricotta Cheesecake', 'dessert', '8', '8']]);
  });

  it('stops filtering by course when "All courses" is selected', async () => {
    mountAdminRecipeList();

    await expect.element(page.getByTestId('recipe-row').first()).toBeVisible();
    await page.getByLabelText('Course').selectOptions('dessert');
    await expect
      .poll(() => rows())
      .toEqual([['Lemon and Ricotta Cheesecake', 'dessert', '8', '8']]);
    await page.getByLabelText('Course').selectOptions('');

    await expect
      .poll(() => rows())
      .toEqual([
        ['Shakshuka', 'main', '3', '3'],
        ['Lemon and Ricotta Cheesecake', 'dessert', '8', '8'],
      ]);
  });

  it('links to the edit and delete pages of each recipe', async () => {
    mountAdminRecipeList({ recipes: [shakshuka] });

    await expect
      .element(page.getByRole('link', { name: 'Edit' }))
      .toBeVisible();
    expect(href('Edit')).toBe('/admin/recipes/shakshuka/edit');
    expect(href('Delete')).toBe('/admin/recipes/shakshuka/delete');
    expect(href('New recipe')).toBe('/admin/recipes/new');
  });

  it('shows "No recipes found" when nothing matches', async () => {
    mountAdminRecipeList();

    await expect.element(page.getByTestId('recipe-row').first()).toBeVisible();
    await page.getByLabelText('Keywords').fill('xyz');

    await expect
      .element(page.getByText('No recipes found', { exact: true }))
      .toBeVisible();
  });

  it('shows the number of recipes found', async () => {
    mountAdminRecipeList();

    await expect
      .element(page.getByText('2 recipe(s)', { exact: true }))
      .toBeVisible();
  });

  it('renders the recipes matching the keywords', async () => {
    mountAdminRecipeList();

    await expect.element(page.getByTestId('recipe-row').first()).toBeVisible();
    await page.getByLabelText('Keywords').fill('ricotta');

    await expect
      .poll(() => rows())
      .toEqual([['Lemon and Ricotta Cheesecake', 'dessert', '8', '8']]);
  });

  it('combines keywords and course', async () => {
    mountAdminRecipeList();

    await expect.element(page.getByTestId('recipe-row').first()).toBeVisible();
    await page.getByLabelText('Keywords').fill('shak');
    await expect.poll(() => rows()).toEqual([['Shakshuka', 'main', '3', '3']]);
    await page.getByLabelText('Course').selectOptions('main');

    await expect.poll(() => rows()).toEqual([['Shakshuka', 'main', '3', '3']]);
  });

  it('keeps keywords when "All courses" is selected again', async () => {
    mountAdminRecipeList({
      recipes: [shakshuka, cheesecake, hummus],
    });

    await expect.element(page.getByTestId('recipe-row').first()).toBeVisible();
    await page.getByLabelText('Course').selectOptions('dessert');
    await expect
      .poll(() => rows())
      .toEqual([['Lemon and Ricotta Cheesecake', 'dessert', '8', '8']]);
    await page.getByLabelText('Keywords').fill('hummus');
    await expect
      .element(page.getByText('No recipes found', { exact: true }))
      .toBeVisible();
    await expect.poll(() => rows()).toEqual([]);

    await page.getByLabelText('Course').selectOptions('');

    await expect
      .poll(() => rows())
      .toEqual([['Hummus with Ful', 'starter', '3', '3']]);
  });
});

function mountAdminRecipeList({
  recipes = [shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminRecipeList);
}

function rows() {
  return page
    .getByTestId('recipe-row')
    .elements()
    .map((row) =>
      [...row.children]
        .slice(0, 4)
        .map((cell) => cell.textContent?.trim() ?? ''),
    );
}

function href(name: string) {
  return page.getByRole('link', { name }).element().getAttribute('href');
}
