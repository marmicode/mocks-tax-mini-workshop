import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { Favorites } from './favorites.ng';

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

describe(Favorites, () => {
  it('searches all recipes', async () => {
    const { search } = mountFavorites([]);

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows only favorite recipes', async () => {
    mountFavorites([cheesecake.id]);

    await expect.poll(recipeNames).toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('shows a message when there are no favorites', async () => {
    const { search } = mountFavorites([]);

    await expect
      .element(page.getByTestId('no-favorites-message'))
      .toMatchTextContent('You have no favorite recipes yet');
    await expect.poll(recipeNames).toEqual([]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('removes a recipe from favorites', async () => {
    const { userFavorites } = mountFavorites([shakshuka.id]);
    const removeFavorite = vi
      .spyOn(userFavorites, 'removeFavorite')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Remove from favorites' }).click();

    await expect
      .poll(() => removeFavorite)
      .toHaveBeenCalledExactlyOnceWith('shakshuka');
  });

  it('disables add when the store says the recipe cannot be added', async () => {
    const { search, mealPlanStore } = mountFavorites([shakshuka.id]);
    const canAdd = vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(false);

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeDisabled();
    expect(search.mock.calls).toMatchSnapshot();
    expect(canAdd).toHaveBeenCalledWith({ recipeId: 'shakshuka' });
  });

  it('shows every favorite recipe', async () => {
    mountFavorites([cheesecake.id, shakshuka.id]);

    await expect
      .poll(recipeNames)
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);
  });

  it('ignores favorites that are no longer in the catalog', async () => {
    const { search } = mountFavorites(['deleted-recipe']);

    await expect
      .element(page.getByTestId('no-favorites-message'))
      .toBeVisible();
    await expect.poll(recipeNames).toEqual([]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('assigns a favorite recipe to the picked weekday', async () => {
    const { mealPlanStore } = mountFavorites([shakshuka.id]);
    vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(true);
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Add to meal plan' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Friday' }))
      .toBeVisible();
    await page.getByRole('button', { name: 'Friday' }).click();

    await expect.poll(() => assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'friday',
      recipeId: 'shakshuka',
    });
  });

  it('shows a message when the repository returns no recipes', async () => {
    const { search } = mountFavorites([shakshuka.id]);
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-favorites-message'))
      .toMatchTextContent('You have no favorite recipes yet');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });
});

function mountFavorites(favoriteIds: string[]) {
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

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) => {
      const catalog = [shakshuka, cheesecake];
      return of(
        params.courses.length > 0
          ? catalog.filter((recipe) => params.courses?.includes(recipe.course))
          : catalog,
      );
    });
  const userFavorites = TestBed.inject(UserFavorites);
  vi.spyOn(userFavorites, 'favoriteIds').mockReturnValue(new Set(favoriteIds));
  const mealPlanStore = TestBed.inject(MealPlanStore);

  TestBed.createComponent(Favorites);

  return { search, userFavorites, mealPlanStore };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
