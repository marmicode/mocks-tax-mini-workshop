import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Course, Recipe } from '@whiskmate/shared-recipe/model';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { CourseBrowser } from './course-browser.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

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

const brownies: Recipe = {
  id: 'tahini-halva-brownies',
  course: 'dessert',
  name: 'Tahini and Halva Brownies',
  description: null,
  pictureUri: 'https://example.com/brownies.jpg',
  ingredients: [],
  steps: [],
};

describe(CourseBrowser.name, () => {
  it('shows the course title and only its recipes', async () => {
    const { fixture } = mountCourseBrowser('dessert');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toBe(
      'Desserts',
    );
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
      'Tahini and Halva Brownies',
    ]);
  });

  it('shows the recipes of the new course when the course changes', async () => {
    const { fixture } = mountCourseBrowser('dessert');
    await fixture.whenStable();

    fixture.componentRef.setInput('course', 'starter');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toBe(
      'Starters',
    );
    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('shows a message when the course has no recipes', async () => {
    const { fixture } = mountCourseBrowser('main', {
      recipes: [hummus, cheesecake],
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes in this course yet');
  });

  it('adds a recipe to favorites', async () => {
    const { fixture, userFavorites } = mountCourseBrowser('dessert', {
      recipes: [cheesecake],
    });
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Add to favorites').click();
    await fixture.whenStable();

    expect(userFavorites.favoriteIds()).toEqual(
      new Set(['lemon-ricotta-cheesecake']),
    );
  });

  it('assigns a recipe to the picked weekday', async () => {
    const { fixture, mealPlanStore } = mountCourseBrowser('dessert', {
      recipes: [cheesecake],
    });
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'add to meal plan').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'sunday').click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments().sunday).toBe('lemon-ricotta-cheesecake');
  });
});

function mountCourseBrowser(
  course: Course,
  {
    recipes = [hummus, shakshuka, cheesecake, brownies],
  }: { recipes?: Recipe[] } = {},
) {
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

  const fixture = TestBed.createComponent(CourseBrowser);
  fixture.componentRef.setInput('course', course);

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
