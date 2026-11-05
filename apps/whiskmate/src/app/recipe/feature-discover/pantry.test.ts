import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page, userEvent } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { Pantry } from './pantry.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: '2 red peppers, sliced' },
    { name: 'garlic, crushed', quantity: { amount: 4, unit: 'cloves' } },
    { name: 'large eggs', quantity: { amount: 6, unit: '' } },
  ])
  .build();

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([
    { name: 'tahini', quantity: { amount: 4, unit: 'tbsp' } },
    { name: 'garlic', quantity: { amount: 1, unit: 'clove' } },
  ])
  .build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .withIngredients([{ name: 'ricotta', quantity: { amount: 250, unit: 'g' } }])
  .build();

describe(Pantry, () => {
  it('searches all recipes', async () => {
    mountPantry({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Baklava', course: 'dessert' })
          .withIngredients([{ name: 'garlic' }])
          .build(),
        recipeMother.withBasicInfo('Cassoulet').withManyIngredients().build(),
        recipeMother
          .withBasicInfo('Shakshuka')
          .withIngredients([{ name: 'garlic' }])
          .withManySteps()
          .build(),
      ],
    });

    await expect.element(page.getByTestId('pantry-hint')).toBeVisible();

    await addIngredient('garlic');

    await expect
      .poll(matchedRecipeNames)
      .toEqual(['Baklava', 'Shakshuka', 'Cassoulet']);
  });

  it('shows recipes using an ingredient I have', async () => {
    mountPantry();

    await addIngredient('Ricotta');

    await expect
      .poll(matchedRecipeNames)
      .toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('ranks recipes by number of matching ingredients', async () => {
    mountPantry();

    await addIngredient('garlic');
    await addIngredient('eggs');

    await expect
      .poll(matchedRecipeNames)
      .toEqual(['Shakshuka', 'Hummus with Ful']);
    await expect
      .poll(() => textsOf('match-count'))
      .toEqual(['2/3 ingredients', '1/2 ingredients']);
  });

  it('shows missing ingredients', async () => {
    mountPantry();

    await addIngredient('garlic');

    await expect
      .poll(() => textsOf('missing-ingredients'))
      .toEqual(['Missing: tahini', 'Missing: red peppers, large eggs']);
  });

  it('removes an ingredient', async () => {
    mountPantry();

    await addIngredient('garlic');
    await addIngredient('ricotta');
    await expect
      .element(page.getByRole('button', { name: 'Remove garlic' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Remove ricotta' }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Remove garlic' }).click();

    await expect
      .poll(matchedRecipeNames)
      .toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('tells when no recipe uses my ingredients', async () => {
    mountPantry();

    await addIngredient('saffron');

    await expect
      .element(page.getByTestId('no-match-message'))
      .toMatchTextContent('No recipe uses these ingredients.');
  });

  it('ignores blank and duplicate ingredients', async () => {
    mountPantry();

    await addIngredient('garlic');
    await addIngredient('  GARLIC ');
    await addIngredient('   ');

    await expect.poll(itemLabels).toEqual(['Remove garlic']);
  });

  it('does not show missing ingredients when I have them all', async () => {
    mountPantry();

    await addIngredient('ricotta');

    await expect
      .poll(() => textsOf('match-count'))
      .toEqual(['1/1 ingredients']);
    await expect.poll(() => textsOf('missing-ingredients')).toEqual([]);
  });

  it('shows the hint again once the last ingredient is removed', async () => {
    mountPantry();

    await addIngredient('tahini');
    await expect.poll(matchedRecipeNames).toEqual(['Hummus with Ful']);

    await page.getByRole('button', { name: 'Remove tahini' }).click();

    await expect.element(page.getByTestId('pantry-hint')).toBeVisible();
    await expect.poll(matchedRecipeNames).toEqual([]);
  });

  it('tells when the repository returns no recipes', async () => {
    mountPantry({ recipes: [] });

    await addIngredient('garlic');

    await expect
      .element(page.getByTestId('no-match-message'))
      .toMatchTextContent('No recipe uses these ingredients.');
  });
});

function mountPantry({
  recipes = [shakshuka, hummus, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(Pantry);
}

async function addIngredient(ingredient: string) {
  const input = page.getByLabelText('Add an ingredient I have');
  await input.fill(ingredient);
  await userEvent.type(input, '{Enter}');
}

function itemLabels() {
  return page
    .getByRole('button', { name: /^Remove / })
    .elements()
    .map((el) => el.getAttribute('aria-label') ?? '');
}

function matchedRecipeNames() {
  return page
    .getByTestId('pantry-match')
    .getByRole('link')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function textsOf(testId: string) {
  return page
    .getByTestId(testId)
    .elements()
    .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}
