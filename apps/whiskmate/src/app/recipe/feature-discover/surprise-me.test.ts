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
import {
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
import { SurpriseMe } from './surprise-me.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(SurpriseMe, () => {
  it('picks a random recipe among all recipes', async () => {
    mountSurpriseMe({ pickIndex: -1 });

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
  });

  it('searches only the chosen course', async () => {
    mountSurpriseMe();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    await page.getByRole('radio', { name: 'Desserts' }).click();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
  });

  it('stops filtering by course when "Any" is chosen', async () => {
    const { randomAdapterFake } = mountSurpriseMe({ pickIndex: -1 });

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');

    await page.getByRole('radio', { name: 'Mains' }).click();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    randomAdapterFake.setPickIndex(-1);
    await page.getByRole('radio', { name: 'Any' }).click();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
  });

  it('picks another recipe when asked again', async () => {
    const { randomAdapterFake } = mountSurpriseMe();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    randomAdapterFake.setPickIndex(-1);
    await page.getByRole('button', { name: 'Surprise me again' }).click();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
  });

  it('shows a message when there is nothing to pick', async () => {
    mountSurpriseMe({ recipes: [] });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('Nothing to surprise you with');
  });

  it('picks among the recipes of the chosen course', async () => {
    mountSurpriseMe();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    await page.getByRole('radio', { name: 'Desserts' }).click();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
  });

  it('links the surprise to its recipe page', async () => {
    mountSurpriseMe();

    await expect
      .element(page.getByText('🎲 main'))
      .toHaveTextContent('🎲 main');
    await expect
      .element(page.getByRole('link', { name: 'See the recipe' }))
      .toHaveAttribute('href', `/recipes/${shakshuka.id}`);
  });

  it('keeps the chosen course when asked again', async () => {
    const { randomAdapterFake } = mountSurpriseMe();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    await page.getByRole('radio', { name: 'Mains' }).click();
    await expect
      .element(page.getByRole('radio', { name: 'Mains' }))
      .toBeChecked();
    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    /* Picking the last recipe would surface the dessert if the course were lost. */
    randomAdapterFake.setPickIndex(-1);
    await page.getByRole('button', { name: 'Surprise me again' }).click();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');
  });

  it('shows a message when the chosen course has no recipes', async () => {
    mountSurpriseMe();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    await page.getByRole('radio', { name: 'Starters' }).click();

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('Nothing to surprise you with');
  });
});

function mountSurpriseMe({
  recipes = [shakshuka, cheesecake],
  pickIndex,
}: { recipes?: Recipe[]; pickIndex?: number } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideRandomAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const randomAdapterFake = TestBed.inject(RandomAdapterFake);
  if (pickIndex != null) {
    randomAdapterFake.setPickIndex(pickIndex);
  }

  TestBed.createComponent(SurpriseMe);

  return { randomAdapterFake };
}
