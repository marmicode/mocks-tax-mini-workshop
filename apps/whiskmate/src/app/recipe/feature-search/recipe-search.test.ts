import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecipeSearch } from './recipe-search.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
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

describe(RecipeSearch, () => {
  it('searches all recipes on load', async () => {
    const { search } = mountRecipeSearch();

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

  it('renders the recipes returned by the repository', async () => {
    const { search, recipeNames } = mountRecipeSearch();

    await expect
      .poll(() => recipeNames())
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);
    expect(search).toHaveBeenCalledOnce();
  });

  it('shows "no recipes" when the repository returns nothing', async () => {
    const { search } = mountRecipeSearch();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByText('No recipes found'))
      .toHaveTextContent('No recipes found');
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('searches by keywords', async () => {
    const { search } = mountRecipeSearch();
    await expect.poll(() => search.mock.calls).toHaveLength(1);

    await page.getByLabelText('Keywords').fill('shak');

    await expect
      .poll(() => search)
      .toHaveBeenLastCalledWith({
        keywords: 'shak',
        maxIngredientCount: null,
        maxStepCount: null,
      });
  });

  it('searches by max ingredients', async () => {
    const { search, recipeNames } = mountRecipeSearch();
    await expect
      .poll(() => recipeNames())
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);

    search.mockImplementation((params) =>
      of(
        {
          [JSON.stringify({
            keywords: '',
            maxIngredientCount: null,
            maxStepCount: null,
          })]: [shakshuka, cheesecake],
          [JSON.stringify({
            keywords: '',
            maxIngredientCount: 5,
            maxStepCount: null,
          })]: [shakshuka],
        }[JSON.stringify(params)] ?? [],
      ),
    );
    await page.getByLabelText('Max Ingredients').fill('5');

    await expect.poll(() => recipeNames()).toEqual(['Shakshuka']);
  });

  it('searches by max steps', async () => {
    const { search } = mountRecipeSearch();
    await expect.poll(() => search.mock.calls).toHaveLength(1);

    await page.getByLabelText('Max Steps').fill('3');

    await expect.poll(() => search.mock.lastCall?.[0]?.maxStepCount).toBe(3);
    expect(search.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "keywords": "",
          "maxIngredientCount": null,
          "maxStepCount": 3,
        },
      ]
    `);
  });

  it('searches by course', async () => {
    const { search, recipeNames } = mountRecipeSearch();
    await expect
      .poll(() => recipeNames())
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);

    await page.getByRole('button', { name: 'dessert' }).click();

    await expect
      .poll(() => recipeNames())
      .toEqual(['Lemon and Ricotta Cheesecake']);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[0]?.[0]).not.toHaveProperty('courses');
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('searches by multiple courses', async () => {
    const { search } = mountRecipeSearch();
    await expect.poll(() => search.mock.calls).toHaveLength(1);

    await page.getByRole('button', { name: 'starter' }).click();
    await expect.poll(() => search.mock.calls).toHaveLength(2);
    await page.getByRole('button', { name: 'dessert' }).click();

    await expect
      .poll(() => search)
      .toHaveBeenLastCalledWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: ['starter', 'dessert'],
      });
    expect(search).toHaveBeenCalledTimes(3);
  });

  it('combines keywords and course', async () => {
    const { search } = mountRecipeSearch();
    await expect.poll(() => search.mock.calls).toHaveLength(1);

    await page.getByLabelText('Keywords').fill('lemon');
    await expect
      .poll(() => search.mock.lastCall?.[0])
      .toMatchObject({ keywords: 'lemon' });
    await page.getByRole('button', { name: 'dessert' }).click();

    await expect.poll(() => search.mock.calls).toHaveLength(3);
    expect(search).toHaveBeenCalledTimes(3);
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/recipe-search-keywords-and-course.calls.json',
    );
  });

  it('combines max ingredients and max steps', async () => {
    const { search } = mountRecipeSearch();
    await expect.poll(() => search.mock.calls).toHaveLength(1);

    await page.getByLabelText('Max Ingredients').fill('8');
    await expect
      .poll(() => search.mock.lastCall?.[0])
      .toMatchObject({ maxIngredientCount: 8 });
    await page.getByLabelText('Max Steps').fill('4');

    await expect
      .poll(() => search)
      .toHaveBeenLastCalledWith({
        keywords: '',
        maxIngredientCount: 8,
        maxStepCount: 4,
      });
  });

  it('searches all recipes again once keywords are cleared', async () => {
    const { search } = mountRecipeSearch();
    await expect.poll(() => search.mock.calls).toHaveLength(1);

    await page.getByLabelText('Keywords').fill('shak');
    await expect
      .poll(() => search.mock.lastCall?.[0])
      .toMatchObject({ keywords: 'shak' });
    await page.getByLabelText('Keywords').fill('');

    await expect.poll(() => search.mock.calls).toHaveLength(3);
    expect(search).toHaveBeenCalledTimes(3);
    expect(isWholeCatalogSearch(search.mock.lastCall![0])).toBe(true);
  });

  it('shows "no recipes" when favorites only is checked without any favorite', async () => {
    const { search, userFavorites, recipeNames } = mountRecipeSearch();
    vi.spyOn(userFavorites, 'favoriteIds').mockReturnValue(new Set());

    await page.getByRole('checkbox', { name: 'Favorites only' }).click();

    await expect
      .element(page.getByText('No recipes found'))
      .toHaveTextContent('No recipes found');
    await expect.poll(() => recipeNames()).toEqual([]);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows only favorites without sending favorites to the repository', async () => {
    const { search, userFavorites, recipeNames } = mountRecipeSearch();
    vi.spyOn(userFavorites, 'favoriteIds').mockReturnValue(
      new Set([cheesecake.id]),
    );

    await page.getByRole('checkbox', { name: 'Favorites only' }).click();

    await expect
      .poll(() => recipeNames())
      .toEqual(['Lemon and Ricotta Cheesecake']);
    expect(Object.keys(search.mock.lastCall![0])).toEqual([
      'keywords',
      'maxIngredientCount',
      'maxStepCount',
    ]);
  });

  it('adds a recipe to favorites', async () => {
    const { search, userFavorites } = mountRecipeSearch();
    search.mockImplementation((params) =>
      params.courses?.length ? of([]) : of([shakshuka]),
    );
    const addFavorite = vi
      .spyOn(userFavorites, 'addFavorite')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Add to favorites' }).click();

    expect(addFavorite).toHaveBeenCalledExactlyOnceWith('shakshuka');
  });

  it('removes a recipe from favorites', async () => {
    const { search, userFavorites } = mountRecipeSearch();
    search.mockImplementation((params) =>
      'courses' in params ? of([]) : of([shakshuka]),
    );
    vi.spyOn(userFavorites, 'favoriteIds').mockReturnValue(
      new Set([shakshuka.id]),
    );
    const removeFavorite = vi
      .spyOn(userFavorites, 'removeFavorite')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Remove from favorites' }).click();

    expect(removeFavorite).toHaveBeenCalledExactlyOnceWith('shakshuka');
  });

  it('assigns a recipe to the picked weekday', async () => {
    const { search, mealPlanStore } = mountRecipeSearch();
    search.mockReturnValue(of([shakshuka]));
    vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(true);
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Add to meal plan' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Wednesday' }))
      .toBeVisible();
    await page.getByRole('button', { name: 'Wednesday' }).click();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'wednesday',
      recipeId: 'shakshuka',
    });
  });

  it('disables add when the store says the recipe cannot be added', async () => {
    const { search, mealPlanStore } = mountRecipeSearch();
    search.mockImplementation((params) =>
      isWholeCatalogSearch(params) ? of([shakshuka]) : of([]),
    );
    const canAdd = vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(false);

    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeDisabled();
    expect(canAdd).toHaveBeenCalledWith({ recipeId: 'shakshuka' });
  });
});

function mountRecipeSearch() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: LocalStorage,
        useValue: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
        },
      },
    ],
  });

  const catalog = [shakshuka, cheesecake];
  const recipeRepository = TestBed.inject(RecipeRepository);
  const search = vi
    .spyOn(recipeRepository, 'search')
    .mockImplementation(({ courses }) =>
      of(
        courses
          ? catalog.filter((recipe) => courses.includes(recipe.course))
          : catalog,
      ),
    );
  const userFavorites = TestBed.inject(UserFavorites);
  const mealPlanStore = TestBed.inject(MealPlanStore);

  TestBed.createComponent(RecipeSearch);

  return {
    search,
    userFavorites,
    mealPlanStore,
    recipeNames: () =>
      page
        .getByRole('heading')
        .elements()
        .map((el) => el.textContent?.trim() ?? ''),
  };
}

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    Object.keys(params).length === 3 &&
    Object.values(params).every((value) => value === '' || value === null)
  );
}
