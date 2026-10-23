import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Course, Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { CourseBrowser } from './course-browser.ng';

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
  it('searches recipes of the course', async () => {
    const { fixture, search } = mountCourseBrowser('dessert');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('shows the course title and its recipes', async () => {
    const { fixture, search } = mountCourseBrowser('dessert');
    search.mockReturnValue(of([cheesecake, brownies]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toBe(
      'Desserts',
    );
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
      'Tahini and Halva Brownies',
    ]);
  });

  it('searches again when the course changes', async () => {
    const { fixture, search } = mountCourseBrowser('dessert');
    await fixture.whenStable();

    fixture.componentRef.setInput('course', 'starter');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toBe(
      'Starters',
    );
  });

  it('shows a message when the course has no recipes', async () => {
    const { fixture, search } = mountCourseBrowser('main');
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes in this course yet');
  });

  it('adds a recipe to favorites', async () => {
    const { fixture, search, userFavorites } = mountCourseBrowser('dessert');
    search.mockReturnValue(of([cheesecake]));
    const addFavorite = vi
      .spyOn(userFavorites, 'addFavorite')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Add to favorites').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
    expect(addFavorite).toHaveBeenCalledExactlyOnceWith(
      'lemon-ricotta-cheesecake',
    );
  });

  it('assigns a recipe to the picked weekday', async () => {
    const { fixture, search, mealPlanStore } = mountCourseBrowser('dessert');
    search.mockReturnValue(of([cheesecake]));
    vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(true);
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'add to meal plan').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'sunday').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
    expect(assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'sunday',
      recipeId: 'lemon-ricotta-cheesecake',
    });
  });
});

function mountCourseBrowser(course: Course) {
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
    .mockReturnValue(of([cheesecake, brownies]));
  const userFavorites = TestBed.inject(UserFavorites);
  const mealPlanStore = TestBed.inject(MealPlanStore);

  const fixture = TestBed.createComponent(CourseBrowser);
  fixture.componentRef.setInput('course', course);

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
