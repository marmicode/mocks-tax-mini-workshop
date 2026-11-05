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
import { SimplestRecipes } from './simplest-recipes.ng';

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withSomeIngredients()
  .build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .build();

describe(SimplestRecipes, () => {
  it('searches all recipes', async () => {
    mountSimplestRecipes({
      recipes: [
        recipeMother.withBasicInfo('Cassoulet').withManyIngredients().build(),
        recipeMother
          .withBasicInfo('Slow-cooked Lamb Stew')
          .withManySteps()
          .build(),
        recipeMother
          .withBasicInfo({ name: 'Baklava', course: 'dessert' })
          .build(),
      ],
    });

    await expect
      .poll(recipeNames)
      .toEqual(['Baklava', 'Slow-cooked Lamb Stew', 'Cassoulet']);
  });

  it('shows recipes with the fewest ingredients first', async () => {
    mountSimplestRecipes({ recipes: [hummus, salad] });

    await expect
      .poll(recipeNames)
      .toEqual([
        'Burnt Aubergine with Tahini and Pomegranate',
        'Hummus with Ful',
      ]);
  });

  it('sorts recipes with as many ingredients by name', async () => {
    mountSimplestRecipes({
      recipes: [recipeMother.withBasicInfo('Shakshuka').build(), salad],
    });

    await expect
      .poll(recipeNames)
      .toEqual(['Burnt Aubergine with Tahini and Pomegranate', 'Shakshuka']);
  });

  it('shows the ingredient count of each recipe', async () => {
    mountSimplestRecipes({ recipes: [hummus] });

    await expect
      .element(page.getByTestId('ingredient-count'))
      .toHaveTextContent('3 ingredients');
  });

  it('shows a message when there are no recipes', async () => {
    mountSimplestRecipes({ recipes: [] });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipes found');
  });
});

function mountSimplestRecipes({
  recipes = [hummus, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(SimplestRecipes);
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
