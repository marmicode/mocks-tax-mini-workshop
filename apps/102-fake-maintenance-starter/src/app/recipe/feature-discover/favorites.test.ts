import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { Favorites } from './favorites.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .build();

describe(Favorites.name, () => {
  it('searches all recipes', async () => {
    const baklava = recipeMother
      .withBasicInfo({ name: 'Baklava', course: 'dessert' })
      .build();
    const cassoulet = recipeMother
      .withBasicInfo('Cassoulet')
      .withManyIngredients()
      .build();
    const elaborate = recipeMother
      .withBasicInfo('Shakshuka')
      .withManySteps()
      .build();
    const { fixture } = mountFavorites({
      favoriteIds: [baklava.id, cassoulet.id, elaborate.id],
      recipes: [baklava, cassoulet, elaborate],
    });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Baklava',
      'Cassoulet',
      'Shakshuka',
    ]);
  });

  it('shows only favorite recipes', async () => {
    const { fixture } = mountFavorites({ favoriteIds: [cheesecake.id] });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('shows a message when there are no favorites', async () => {
    const { fixture } = mountFavorites({ favoriteIds: [] });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-favorites-message"]',
      )?.textContent,
    ).toContain('You have no favorite recipes yet');
  });

  it('removes a recipe from favorites', async () => {
    const { fixture, userFavorites } = mountFavorites({
      favoriteIds: [shakshuka.id],
    });
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Remove from favorites').click();
    await fixture.whenStable();

    expect(userFavorites.favoriteIds()).toEqual(new Set());
  });

  it('disables add when the recipe is already planned', async () => {
    const { fixture, mealPlanStore } = mountFavorites({
      favoriteIds: [shakshuka.id],
    });
    mealPlanStore.assign({ weekday: 'monday', recipeId: shakshuka.id });
    await fixture.whenStable();

    expect(
      buttonByText(fixture.nativeElement, 'add to meal plan').disabled,
    ).toBe(true);
  });

  it('shows every favorite recipe', async () => {
    const { fixture } = mountFavorites({
      favoriteIds: [cheesecake.id, shakshuka.id],
    });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('ignores favorites that are no longer in the catalog', async () => {
    const { fixture } = mountFavorites({ favoriteIds: ['deleted-recipe'] });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-favorites-message"]',
      ),
    ).not.toBeNull();
  });

  it('assigns a favorite recipe to the picked weekday', async () => {
    const { fixture, mealPlanStore } = mountFavorites({
      favoriteIds: [shakshuka.id],
    });
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'add to meal plan').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'friday').click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments().friday).toBe(shakshuka.id);
  });

  it('shows a message when the repository returns no recipes', async () => {
    const { fixture } = mountFavorites({
      favoriteIds: [shakshuka.id],
      recipes: [],
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-favorites-message"]',
      )?.textContent,
    ).toContain('You have no favorite recipes yet');
  });
});

function mountFavorites({
  favoriteIds,
  recipes = [shakshuka, cheesecake],
}: {
  favoriteIds: string[];
  recipes?: Recipe[];
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const userFavorites = TestBed.inject(UserFavorites);
  for (const favoriteId of favoriteIds) {
    userFavorites.addFavorite(favoriteId);
  }
  const mealPlanStore = TestBed.inject(MealPlanStore);

  const fixture = TestBed.createComponent(Favorites);

  return { fixture, userFavorites, mealPlanStore };
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
