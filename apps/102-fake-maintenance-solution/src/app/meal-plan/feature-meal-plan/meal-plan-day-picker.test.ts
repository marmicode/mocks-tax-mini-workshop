import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { WEEKDAYS, type Weekday } from '@whiskmate/shared/model';
import { MealPlanDayPicker } from './meal-plan-day-picker.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const lambKofte = recipeMother
  .withBasicInfo('Lamb Kofte with Yogurt and Sumac')
  .build();

const cassoulet = recipeMother
  .withBasicInfo('Cassoulet')
  .withManyIngredients()
  .build();

const beefWellington = recipeMother
  .withBasicInfo('Beef Wellington')
  .withManySteps()
  .build();

const emptyAssignments: WeekdayAssignments = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

describe(MealPlanDayPicker, () => {
  it('searches the catalog', async () => {
    mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: emptyAssignments,
      recipes: [shakshuka, cassoulet, beefWellington],
    });

    await expect
      .poll(() => candidateNames())
      .toEqual(['Shakshuka', 'Cassoulet', 'Beef Wellington']);
  });

  it('only lists mains', async () => {
    mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: emptyAssignments,
      recipes: [hummus, shakshuka, lambKofte],
    });

    await expect
      .poll(() => candidateNames())
      .toEqual(['Shakshuka', 'Lamb Kofte with Yogurt and Sumac']);
  });

  it('does not list mains that are already planned', async () => {
    mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: { ...emptyAssignments, tuesday: shakshuka.id },
      recipes: [shakshuka, lambKofte],
    });

    await expect
      .poll(() => candidateNames())
      .toEqual(['Lamb Kofte with Yogurt and Sumac']);
  });

  it('assigns the picked main and goes back to the meal plan', async () => {
    const { mealPlanStore, router } = mountMealPlanDayPicker({
      weekday: 'thursday',
      assignments: emptyAssignments,
      recipes: [shakshuka, lambKofte],
    });

    await page.getByRole('button', { name: 'Pick Shakshuka' }).click();

    await expect
      .poll(() => mealPlanStore.assignments().thursday)
      .toBe(shakshuka.id);
    await expect.poll(() => router.url).toBe('/meal-plan');
  });

  it('says there is nothing left to pick when every main is planned', async () => {
    mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: { ...emptyAssignments, tuesday: shakshuka.id },
      recipes: [hummus, shakshuka],
    });

    await expect.element(page.getByTestId('no-candidates')).toBeVisible();
  });
});

function mountMealPlanDayPicker({
  weekday,
  assignments,
  recipes,
}: {
  weekday: Weekday;
  assignments: WeekdayAssignments;
  recipes: Recipe[];
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'meal-plan', children: [] }]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  planWeek(mealPlanStore, assignments);
  const router = TestBed.inject(Router);

  TestBed.createComponent(MealPlanDayPicker, {
    bindings: [inputBinding('weekday', () => weekday)],
  });

  return { mealPlanStore, router };
}

function planWeek(
  mealPlanStore: MealPlanStore,
  assignments: WeekdayAssignments,
): void {
  for (const weekday of WEEKDAYS) {
    const recipeId = assignments[weekday];
    if (recipeId != null) {
      mealPlanStore.assign({ weekday, recipeId });
    }
  }
}

function candidateNames() {
  return page
    .getByTestId('candidate-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
