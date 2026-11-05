import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { ClockAdapter } from '@whiskmate/shared/infra';
import { RecipeOfTheDay } from './recipe-of-the-day.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeOfTheDay, () => {
  it('searches all recipes', async () => {
    const { search } = mountRecipeOfTheDay(new Date(2026, 0, 1));

    await expect.poll(() => search.mock.calls).toHaveLength(1);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('picks the recipe matching the day of the year', async () => {
    /* January 2nd is the 2nd day of the year: 2 % 3 = 2. */
    const { search } = mountRecipeOfTheDay(new Date(2026, 0, 2));

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
    expect(search).toHaveBeenCalledOnce();
  });

  it('picks another recipe the next day', async () => {
    /* January 3rd is the 3rd day of the year: 3 % 3 = 0. */
    mountRecipeOfTheDay(new Date(2026, 0, 3));

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');
  });

  it('shows the description, picture and a link to the recipe', async () => {
    const { search } = mountRecipeOfTheDay(new Date(2026, 0, 3));

    await expect
      .element(page.getByTestId('recipe-description'))
      .toMatchTextContent('Eggs poached in a spiced tomato sauce.');
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toHaveAttribute('src', 'https://example.com/shakshuka.jpg');
    await expect
      .element(page.getByRole('link', { name: 'See the recipe' }))
      .toHaveAttribute('href', '/recipes/shakshuka');
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('shows a message when there are no recipes', async () => {
    const { search } = mountRecipeOfTheDay(new Date(2026, 0, 3));
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipe today');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
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
    const { search } = mountRecipeOfTheDay(new Date(2026, 0, 1));

    await expect
      .element(page.getByText("Today's pick · starter"))
      .toHaveTextContent("Today's pick · starter");
    expect(search).toHaveBeenCalledOnce();
  });

  it('counts days across months', async () => {
    /* February 1st is the 32nd day of the year: 32 % 3 = 2. */
    mountRecipeOfTheDay(new Date(2026, 1, 1));

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
  });

  it('always picks the only recipe of the catalog', async () => {
    const { search } = mountRecipeOfTheDay(new Date(2026, 11, 31));
    search.mockReturnValue(of([hummus]));

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Hummus with Ful');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });
});

function mountRecipeOfTheDay(now: Date) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) =>
      /* Recipe of the day is picked from the whole catalog. */
      isWholeCatalogSearch(params)
        ? of([shakshuka, hummus, cheesecake])
        : of([]),
    );
  vi.spyOn(TestBed.inject(ClockAdapter), 'now').mockReturnValue(now);

  TestBed.createComponent(RecipeOfTheDay);

  return { search };
}

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    Object.keys(params).length === 3 &&
    Object.values(params).every((value) => value === '' || value === null)
  );
}
