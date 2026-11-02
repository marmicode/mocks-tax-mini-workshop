import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { RecipeDetail } from './recipe-detail.ng';

const shakshuka = recipeMother
  .withBasicInfo({
    name: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato sauce.',
  })
  .withIngredients([
    { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
    { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
    { name: 'fresh coriander, to serve' },
  ])
  .withSteps(['Heat the olive oil.', 'Crack the eggs into the sauce.'])
  .build();

const harissaChicken = recipeMother
  .withBasicInfo('Harissa-Roasted Chicken')
  .build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(RecipeDetail, () => {
  it('shows the recipe with the given id', async () => {
    mountRecipeDetail(harissaChicken.id);

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Harissa-Roasted Chicken');
  });

  it('shows the recipe name, course, description and picture', async () => {
    mountRecipeDetail(shakshuka.id);

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByTestId('recipe-course'))
      .toHaveTextContent('main');
    await expect
      .element(page.getByTestId('recipe-description'))
      .toHaveTextContent('Eggs poached in a spiced tomato sauce.');
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toHaveAttribute('src', 'https://example.com/shakshuka.jpg');
  });

  it('shows ingredients with their quantities and steps', async () => {
    mountRecipeDetail(shakshuka.id);

    await expect
      .poll(() => textsOf('ingredient'))
      .toEqual([
        '3 tbsp olive oil',
        '6 large eggs',
        'fresh coriander, to serve',
      ]);
    await expect
      .poll(() => textsOf('step'))
      .toEqual(['Heat the olive oil.', 'Crack the eggs into the sauce.']);
  });

  it('links to cooking mode and scaler', async () => {
    mountRecipeDetail(shakshuka.id);

    await expect
      .element(page.getByRole('link', { name: /Start cooking/ }))
      .toHaveAttribute('href', `/recipes/${shakshuka.id}/cook`);
    await expect
      .element(page.getByRole('link', { name: /Scale servings/ }))
      .toHaveAttribute('href', `/recipes/${shakshuka.id}/scale`);
  });

  it('shows similar recipes of the same course', async () => {
    mountRecipeDetail(shakshuka.id);

    await expect
      .poll(() => textsOf('similar-recipe'))
      .toEqual(['Harissa-Roasted Chicken']);
  });

  it('adds the recipe to favorites', async () => {
    const { userFavorites } = mountRecipeDetail(shakshuka.id);

    await page.getByRole('button', { name: 'Add to favorites' }).click();

    await expect
      .poll(() => userFavorites.favoriteIds())
      .toEqual(new Set([shakshuka.id]));
  });

  it('shows a message when the recipe does not exist', async () => {
    mountRecipeDetail('missing');

    await expect
      .element(page.getByTestId('recipe-not-found'))
      .toHaveTextContent('This recipe does not exist.');
    await expect.poll(() => textsOf('similar-recipe')).toEqual([]);
  });
});

function mountRecipeDetail(
  recipeId: string,
  {
    recipes = [shakshuka, harissaChicken, cheesecake],
  }: { recipes?: Recipe[] } = {},
) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const userFavorites = TestBed.inject(UserFavorites);

  TestBed.createComponent(RecipeDetail, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });

  return { userFavorites };
}

function textsOf(testId: string) {
  return page
    .getByTestId(testId)
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
