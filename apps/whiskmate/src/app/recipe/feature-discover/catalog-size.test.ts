import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { CatalogSize } from './catalog-size.ng';

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([{ name: '400g chickpeas' }, { name: 'tahini' }])
  .build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .withIngredients([{ name: '2 aubergines' }, { name: 'Tahini' }])
  .build();

describe(CatalogSize, () => {
  it('searches all recipes', async () => {
    mountCatalogSize({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Baklava', course: 'dessert' })
          .build(),
        recipeMother.withBasicInfo('Cassoulet').withManyIngredients().build(),
        recipeMother.withBasicInfo('Shakshuka').withManySteps().build(),
      ],
    });

    await expect
      .element(page.getByTestId('catalog-size'))
      .toHaveTextContent('3 recipes');
  });

  it('shows the number of recipes', async () => {
    mountCatalogSize({ recipes: [hummus, salad] });

    await expect
      .element(page.getByTestId('catalog-size'))
      .toHaveTextContent('2 recipes');
  });

  it('uses the singular for a single recipe', async () => {
    mountCatalogSize({ recipes: [hummus] });

    await expect
      .element(page.getByTestId('catalog-size'))
      .toHaveTextContent('1 recipe');
  });

  it('counts distinct ingredients', async () => {
    mountCatalogSize({ recipes: [hummus, salad] });

    await expect
      .element(page.getByTestId('ingredient-count'))
      .toHaveTextContent('Using 3 distinct ingredients.');
  });

  it('shows a message when the catalog is empty', async () => {
    mountCatalogSize({ recipes: [] });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toHaveTextContent('The catalog is empty.');
  });
});

function mountCatalogSize({
  recipes = [hummus, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(CatalogSize);
}
