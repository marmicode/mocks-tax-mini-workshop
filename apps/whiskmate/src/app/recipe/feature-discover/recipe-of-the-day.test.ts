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
  ClockAdapterFake,
  provideClockAdapterFake,
} from '@whiskmate/shared/infra';
import { RecipeOfTheDay } from './recipe-of-the-day.ng';

const shakshuka = recipeMother
  .withBasicInfo({
    name: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato sauce.',
  })
  .build();

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .build();

describe(RecipeOfTheDay, () => {
  it('searches all recipes', async () => {
    /* January 2nd is the 2nd day of the year: 2 % 3 = 2, the last recipe. */
    mountRecipeOfTheDay(new Date(2026, 0, 2), {
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
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Baklava');
  });

  it('picks the recipe matching the day of the year', async () => {
    /* January 2nd is the 2nd day of the year: 2 % 3 = 2. */
    mountRecipeOfTheDay(new Date(2026, 0, 2));

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
  });

  it('picks another recipe the next day', async () => {
    /* January 3rd is the 3rd day of the year: 3 % 3 = 0. */
    mountRecipeOfTheDay(new Date(2026, 0, 3));

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');
  });

  it('shows the description, picture and a link to the recipe', async () => {
    mountRecipeOfTheDay(new Date(2026, 0, 3));

    await expect
      .element(page.getByTestId('recipe-description'))
      .toMatchTextContent('Eggs poached in a spiced tomato sauce.');
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toHaveAttribute('src', shakshuka.pictureUri);
    await expect
      .element(page.getByRole('link', { name: 'See the recipe' }))
      .toHaveAttribute('href', `/recipes/${shakshuka.id}`);
  });

  it('shows a message when there are no recipes', async () => {
    mountRecipeOfTheDay(new Date(2026, 0, 3), {
      recipes: [],
    });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipe today');
  });

  it('hides the description when the recipe has none', async () => {
    /* January 1st is the 1st day of the year: 1 % 3 = 1. */
    mountRecipeOfTheDay(new Date(2026, 0, 1));

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Hummus with Ful');
    await expect
      .element(page.getByTestId('recipe-description'))
      .not.toBeInTheDocument();
  });

  it("shows the course of today's pick", async () => {
    mountRecipeOfTheDay(new Date(2026, 0, 1));

    await expect
      .element(page.getByText("Today's pick · starter"))
      .toHaveTextContent("Today's pick · starter");
  });

  it('counts days across months', async () => {
    /* February 1st is the 32nd day of the year: 32 % 3 = 2. */
    mountRecipeOfTheDay(new Date(2026, 1, 1));

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
  });

  it('always picks the only recipe of the catalog', async () => {
    mountRecipeOfTheDay(new Date(2026, 11, 31), {
      recipes: [hummus],
    });

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Hummus with Ful');
  });
});

function mountRecipeOfTheDay(
  now: Date,
  { recipes = [shakshuka, hummus, cheesecake] }: { recipes?: Recipe[] } = {},
) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideClockAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  TestBed.inject(ClockAdapterFake).setNow(now);

  TestBed.createComponent(RecipeOfTheDay);
}
