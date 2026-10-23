import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe(Favorites.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountFavorites([]);
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows only favorite recipes', async () => {
    const { fixture, search } = mountFavorites([cheesecake.id]);
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('shows a message when there are no favorites', async () => {
    const { fixture, search } = mountFavorites([]);
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-favorites-message"]',
      )?.textContent,
    ).toContain('You have no favorite recipes yet');
  });

  it('removes a recipe from favorites', async () => {
    const { fixture, search, userFavorites } = mountFavorites([shakshuka.id]);
    const removeFavorite = vi
      .spyOn(userFavorites, 'removeFavorite')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Remove from favorites').click();
    await fixture.whenStable();

    expect(removeFavorite).toHaveBeenCalledExactlyOnceWith('shakshuka');
  });

  it('disables add when the store says the recipe cannot be added', async () => {
    const { fixture, search, mealPlanStore } = mountFavorites([shakshuka.id]);
    const canAdd = vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(false);
    await fixture.whenStable();

    expect(search.mock.calls).toMatchSnapshot();
    expect(canAdd).toHaveBeenCalledWith({ recipeId: 'shakshuka' });
    expect(
      buttonByText(fixture.nativeElement, 'add to meal plan').disabled,
    ).toBe(true);
  });

  it('shows every favorite recipe', async () => {
    const { fixture, search } = mountFavorites([cheesecake.id, shakshuka.id]);
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('ignores favorites that are no longer in the catalog', async () => {
    const { fixture, search } = mountFavorites(['deleted-recipe']);
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-favorites-message"]',
      ),
    ).not.toBeNull();
  });

  it('assigns a favorite recipe to the picked weekday', async () => {
    const { fixture, search, mealPlanStore } = mountFavorites([shakshuka.id]);
    vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(true);
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'add to meal plan').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'friday').click();
    await fixture.whenStable();

    expect(assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'friday',
      recipeId: 'shakshuka',
    });
  });

  it('shows a message when the repository returns no recipes', async () => {
    const { fixture, search } = mountFavorites([shakshuka.id]);
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-favorites-message"]',
      )?.textContent,
    ).toContain('You have no favorite recipes yet');
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

  const fixture = TestBed.createComponent(Favorites);

  return { fixture, search, userFavorites, mealPlanStore };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function buttonByLabel(root: HTMLElement, label: string): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );
  if (button == null) {
    throw new Error(`Button "${label}" not found.`);
  }
  return button;
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim().toLowerCase() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
