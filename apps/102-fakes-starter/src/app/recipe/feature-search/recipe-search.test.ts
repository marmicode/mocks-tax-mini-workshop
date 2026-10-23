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
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { RecipeSearch } from './recipe-search.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
  steps: ['Blend the chickpeas with the tahini.'],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }, { name: 'peppers' }],
  steps: ['Cook the sauce.', 'Poach the eggs.', 'Serve.'],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [
    { name: 'ricotta' },
    { name: 'eggs' },
    { name: 'sugar' },
    { name: 'lemons' },
    { name: 'flour' },
    { name: 'butter' },
  ],
  steps: ['Mix everything.', 'Bake.'],
};

describe(RecipeSearch.name, () => {
  it('shows every recipe of the catalog on load', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('shows "no recipes" when the catalog is empty', async () => {
    const { fixture } = mountRecipeSearch({ recipes: [] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes found');
  });

  it('searches by keywords', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'shak');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Shakshuka']);
  });

  it('searches by max ingredients', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Max Ingredients'), '5');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
    ]);
  });

  it('searches by max steps', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Max Steps'), '2');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('searches by course', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('searches by multiple courses', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    clickCourse(fixture.nativeElement, 'starter');
    await fixture.whenStable();
    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('shows no recipe once every selected course is unselected', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    clickCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    clickCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([]);
  });

  it('combines keywords and course', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'a');
    await fixture.whenStable();
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);

    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('combines max ingredients and max steps', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Max Ingredients'), '5');
    await fixture.whenStable();
    typeInto(inputByLabel(fixture.nativeElement, 'Max Steps'), '2');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('shows all recipes again once keywords are cleared', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'shak');
    await fixture.whenStable();
    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), '');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('shows no recipe once the course is unselected even with keywords', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'a');
    await fixture.whenStable();
    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();
    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([]);
  });

  it('shows "no recipes" when favorites only is checked without any favorite', async () => {
    const { fixture } = mountRecipeSearch();
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Favorites only').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes found');
  });

  it('shows only favorites', async () => {
    const { fixture, userFavorites } = mountRecipeSearch();
    userFavorites.addFavorite(cheesecake.id);
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Favorites only').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('adds a recipe to favorites', async () => {
    const { fixture, userFavorites } = mountRecipeSearch({
      recipes: [shakshuka],
    });
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Add to favorites').click();
    await fixture.whenStable();

    expect(userFavorites.favoriteIds()).toEqual(new Set(['shakshuka']));
  });

  it('removes a recipe from favorites', async () => {
    const { fixture, userFavorites } = mountRecipeSearch({
      recipes: [shakshuka],
    });
    userFavorites.addFavorite(shakshuka.id);
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Remove from favorites').click();
    await fixture.whenStable();

    expect(userFavorites.favoriteIds()).toEqual(new Set());
  });

  it('assigns a recipe to the picked weekday', async () => {
    const { fixture, mealPlanStore } = mountRecipeSearch({
      recipes: [shakshuka],
    });
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'add to meal plan').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'wednesday').click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments().wednesday).toBe('shakshuka');
  });

  it('disables add when the recipe is already planned', async () => {
    const { fixture, mealPlanStore } = mountRecipeSearch({
      recipes: [shakshuka],
    });
    mealPlanStore.assign({ weekday: 'monday', recipeId: 'shakshuka' });
    await fixture.whenStable();

    expect(
      buttonByText(fixture.nativeElement, 'add to meal plan').disabled,
    ).toBe(true);
  });
});

function mountRecipeSearch({
  recipes = [hummus, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const userFavorites = TestBed.inject(UserFavorites);
  const mealPlanStore = TestBed.inject(MealPlanStore);

  const fixture = TestBed.createComponent(RecipeSearch);

  return { fixture, userFavorites, mealPlanStore };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function inputByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const field = [...root.querySelectorAll('mat-form-field')].find(
    (el) => el.querySelector('mat-label')?.textContent?.trim() === label,
  );
  const input = field?.querySelector('input');
  if (input == null) {
    throw new Error(`Input "${label}" not found.`);
  }
  return input;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function clickCourse(root: HTMLElement, course: string): void {
  const toggle = [...root.querySelectorAll('mat-button-toggle')].find(
    (el) => el.textContent?.trim() === course,
  );
  const button = toggle?.querySelector('button');
  if (button == null) {
    throw new Error(`Course "${course}" not found.`);
  }
  button.click();
}

function checkboxByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const checkbox = [...root.querySelectorAll('mat-checkbox')].find(
    (el) => el.textContent?.trim() === label,
  );
  const input = checkbox?.querySelector('input');
  if (input == null) {
    throw new Error(`Checkbox "${label}" not found.`);
  }
  return input;
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
