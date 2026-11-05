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
import { AlphabeticalIndex } from './alphabetical-index.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .build();

const sabich = recipeMother.withBasicInfo('Sabich').build();

describe(AlphabeticalIndex, () => {
  it('searches all recipes', async () => {
    mountAlphabeticalIndex({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Baklava', course: 'dessert' })
          .build(),
        recipeMother.withBasicInfo('Cassoulet').withManyIngredients().build(),
        recipeMother.withBasicInfo('Shakshuka').withManySteps().build(),
      ],
    });

    await expect
      .poll(recipeNames)
      .toEqual(['Baklava', 'Cassoulet', 'Shakshuka']);
  });

  it('groups recipes by first letter in alphabetical order', async () => {
    mountAlphabeticalIndex({
      recipes: [shakshuka, salad, sabich],
    });

    await expect.poll(letters).toEqual(['B', 'S']);
  });

  it('sorts recipes by name within a letter', async () => {
    mountAlphabeticalIndex({
      recipes: [shakshuka, sabich],
    });

    await expect.poll(recipeNames).toEqual(['Sabich', 'Shakshuka']);
  });

  it('puts recipes not starting with a letter at the end', async () => {
    mountAlphabeticalIndex({
      recipes: [recipeMother.withBasicInfo('7-hour Lamb').build(), shakshuka],
    });

    await expect.poll(letters).toEqual(['S', '#']);
  });

  it('links each recipe to its detail page', async () => {
    mountAlphabeticalIndex({ recipes: [sabich] });

    await expect
      .element(page.getByRole('link', { name: 'Sabich' }))
      .toHaveTextContent('Sabich');
    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveAttribute('href', '/recipes/sabich');
  });

  it('shows a message when there are no recipes', async () => {
    mountAlphabeticalIndex({ recipes: [] });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipes to index');
  });
});

function mountAlphabeticalIndex({
  recipes = [shakshuka, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AlphabeticalIndex);
}

function letters() {
  return page
    .getByTestId('letter')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
