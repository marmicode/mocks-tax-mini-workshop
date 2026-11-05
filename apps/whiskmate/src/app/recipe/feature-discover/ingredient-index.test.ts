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
import { IngredientIndex } from './ingredient-index.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: '2 red peppers, sliced' },
    { name: 'garlic, crushed', quantity: { amount: 4, unit: 'cloves' } },
    { name: '800g tinned chopped tomatoes' },
  ])
  .build();

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([
    { name: 'tahini', quantity: { amount: 4, unit: 'tbsp' } },
    { name: 'garlic', quantity: { amount: 1, unit: 'clove' } },
  ])
  .build();

describe(IngredientIndex, () => {
  it('searches all recipes', async () => {
    mountIngredientIndex({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Baklava', course: 'dessert' })
          .withIngredients([{ name: 'pistachios' }])
          .build(),
        recipeMother.withBasicInfo('Cassoulet').withManyIngredients().build(),
        recipeMother
          .withBasicInfo('Shakshuka')
          .withIngredients([{ name: 'saffron' }])
          .withManySteps()
          .build(),
      ],
    });

    await expect.poll(() => recipeNamesFor('pistachios')).toEqual(['Baklava']);
    await expect.poll(() => recipeNamesFor('salt')).toEqual(['Cassoulet']);
    await expect.poll(() => recipeNamesFor('saffron')).toEqual(['Shakshuka']);
  });

  it('lists normalized ingredient names alphabetically', async () => {
    mountIngredientIndex();

    await expect
      .poll(ingredientNames)
      .toEqual(['garlic', 'red peppers', 'tahini', 'tinned chopped tomatoes']);
  });

  it('groups ingredients by first letter', async () => {
    mountIngredientIndex();

    await expect.poll(sectionLetters).toEqual(['g', 'r', 't']);
  });

  it('lists every recipe using an ingredient', async () => {
    mountIngredientIndex();

    await expect
      .poll(() => recipeNamesFor('garlic'))
      .toEqual(['Shakshuka', 'Hummus with Ful']);
  });

  it('filters ingredients', async () => {
    mountIngredientIndex();

    await page.getByLabelText('Filter ingredients').fill('ta');

    await expect.poll(ingredientNames).toEqual(['tahini']);
  });

  it('shows a message when no ingredient matches', async () => {
    mountIngredientIndex();

    await page.getByLabelText('Filter ingredients').fill('saffron');

    await expect
      .element(page.getByTestId('no-ingredients-message'))
      .toMatchTextContent('No ingredients found.');
  });

  it('filters ingredients ignoring case and surrounding spaces', async () => {
    mountIngredientIndex();

    await page.getByLabelText('Filter ingredients').fill('  GAR ');

    await expect.poll(ingredientNames).toEqual(['garlic']);
  });

  it('lists a recipe only once when it uses an ingredient twice', async () => {
    mountIngredientIndex({
      recipes: [
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withIngredients([
            { name: 'garlic, crushed' },
            { name: '2 garlic, roasted' },
          ])
          .build(),
      ],
    });

    await expect.poll(ingredientNames).toEqual(['garlic']);
    await expect
      .poll(() => recipeNamesFor('garlic'))
      .toEqual(['Hummus with Ful']);
  });

  it('links each recipe to its detail page', async () => {
    mountIngredientIndex();

    await expect
      .element(recipeLinks('tahini'))
      .toHaveTextContent('Hummus with Ful');
    await expect
      .poll(() => recipeLinksFor('tahini'))
      .toEqual([`/recipes/${hummus.id}`]);
  });

  it('shows a message when the repository returns no recipes', async () => {
    mountIngredientIndex({ recipes: [] });

    await expect
      .element(page.getByTestId('no-ingredients-message'))
      .toMatchTextContent('No ingredients found.');
    await expect.poll(sectionLetters).toEqual([]);
  });
});

function mountIngredientIndex({
  recipes = [shakshuka, hummus],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(IngredientIndex);
}

function ingredientNames() {
  return page
    .getByRole('term')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function sectionLetters() {
  return page
    .getByTestId('index-section')
    .getByRole('heading')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function entry(ingredient: string) {
  return page
    .getByTestId('index-entry')
    .filter({ hasText: ingredient });
}

function recipeNamesFor(ingredient: string) {
  return entry(ingredient)
    .getByRole('link')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function recipeLinks(ingredient: string) {
  return entry(ingredient).getByRole('link');
}

function recipeLinksFor(ingredient: string) {
  return recipeLinks(ingredient)
    .elements()
    .map((el) => el.getAttribute('href') ?? '');
}
