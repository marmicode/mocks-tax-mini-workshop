import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import type { Weekday } from '@whiskmate/shared/model';
import { MealPlanSwap } from './meal-plan-swap.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const lambKofte: Recipe = {
  id: 'lamb-kofte',
  course: 'main',
  name: 'Lamb Kofte with Yogurt and Sumac',
  description: null,
  pictureUri: 'https://example.com/lamb-kofte.jpg',
  ingredients: [],
  steps: [],
};

const harissaChicken: Recipe = {
  id: 'harissa-chicken',
  course: 'main',
  name: 'Harissa-Roasted Chicken',
  description: null,
  pictureUri: 'https://example.com/harissa-chicken.jpg',
  ingredients: [],
  steps: [],
};

const emptyAssignments: WeekdayAssignments = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

describe(MealPlanSwap, () => {
  it('fetches the planned recipe and searches recipes of the same course', async () => {
    const { findById, search } = mountMealPlanSwap('monday', {
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));

    await expect
      .element(page.getByTestId('current-recipe'))
      .toHaveTextContent('Shakshuka');
    expect(findById).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'shakshuka' });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('lists alternatives that are not planned yet', async () => {
    const { findById, search } = mountMealPlanSwap('monday', {
      ...emptyAssignments,
      monday: 'shakshuka',
      tuesday: 'harissa-chicken',
    });
    findById.mockReturnValue(of(shakshuka));
    search.mockReturnValue(of([shakshuka, lambKofte, harissaChicken]));

    await expect
      .poll(() => alternativeNames())
      .toEqual(['Lamb Kofte with Yogurt and Sumac']);
  });

  it('assigns the picked recipe and goes back to the meal plan', async () => {
    const { findById, search, mealPlanStore, router } = mountMealPlanSwap(
      'friday',
      {
        ...emptyAssignments,
        friday: 'shakshuka',
      },
    );
    findById.mockReturnValue(of(shakshuka));
    search.mockReturnValue(of([shakshuka, lambKofte]));
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await page
      .getByRole('button', { name: 'Pick Lamb Kofte with Yogurt and Sumac' })
      .click();

    await expect.poll(() => assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'friday',
      recipeId: 'lamb-kofte',
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'meal-plan']);
  });

  it('says there is no alternative when every recipe of the course is planned', async () => {
    const { findById, search } = mountMealPlanSwap('monday', {
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));
    search.mockReturnValue(of([shakshuka]));

    await expect.element(page.getByTestId('no-alternatives')).toBeVisible();
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('does not search anything when nothing is planned that day', async () => {
    const { findById, search } = mountMealPlanSwap('monday', emptyAssignments);

    await expect.element(page.getByTestId('nothing-planned')).toBeVisible();
    expect(findById).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });
});

function mountMealPlanSwap(weekday: Weekday, assignments: WeekdayAssignments) {
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

  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(undefined));
  const search = vi.spyOn(recipeRepository, 'search').mockReturnValue(of([]));
  const mealPlanStore = TestBed.inject(MealPlanStore);
  vi.spyOn(mealPlanStore, 'assignments').mockReturnValue(assignments);
  const router = TestBed.inject(Router);

  TestBed.createComponent(MealPlanSwap, {
    bindings: [inputBinding('weekday', () => weekday)],
  });

  return { findById, search, mealPlanStore, router };
}

function alternativeNames() {
  return page
    .getByTestId('alternative-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
