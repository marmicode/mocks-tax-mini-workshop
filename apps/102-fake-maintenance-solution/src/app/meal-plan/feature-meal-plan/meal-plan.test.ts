import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { WEEKDAYS } from '@whiskmate/shared/model';
import { MealPlan } from './meal-plan.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
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

describe(MealPlan, () => {
  it('shows every day as empty when nothing is planned', async () => {
    mountMealPlan(emptyAssignments);

    await expect
      .element(page.getByText('No recipe is planned', { exact: true }))
      .toHaveLength(7);
  });

  it('shows the planned recipe', async () => {
    mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
    });

    await expect
      .element(page.getByText('Shakshuka', { exact: true }))
      .toBeVisible();
  });

  it('shows each planned recipe', async () => {
    mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
      friday: cheesecake.id,
    });

    await expect
      .element(page.getByText('Shakshuka', { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByText('Lemon and Ricotta Cheesecake', { exact: true }))
      .toBeVisible();
  });

  it('shows the name and picture of a planned recipe', async () => {
    mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
    });

    await expect
      .element(page.getByText('Shakshuka', { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toBeVisible();
    expect(
      page
        .getByRole('img', { name: 'Shakshuka' })
        .element()
        .getAttribute('src'),
    ).toBe(shakshuka.pictureUri);
    await expect
      .element(page.getByText('No recipe is planned', { exact: true }))
      .toHaveLength(6);
  });

  it('renders a missing recipe as an empty day', async () => {
    mountMealPlan({
      ...emptyAssignments,
      monday: 'missing',
    });

    await expect
      .element(page.getByText('Monday', { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByText('No recipe is planned', { exact: true }))
      .toHaveLength(7);
  });

  it('clears a day', async () => {
    const { mealPlanStore } = mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
    });

    await page.getByRole('button', { name: 'Remove' }).click();

    await expect.poll(() => mealPlanStore.assignments().monday).toBeNull();
    await expect
      .element(page.getByText('No recipe is planned', { exact: true }))
      .toHaveLength(7);
  });

  it('links each empty day to the recipe picker', async () => {
    mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
    });

    await expect
      .element(page.getByText('Shakshuka', { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Pick a recipe' }))
      .toHaveLength(6);
    expect(pickHrefs()).toEqual([
      '/meal-plan/tuesday/pick',
      '/meal-plan/wednesday/pick',
      '/meal-plan/thursday/pick',
      '/meal-plan/friday/pick',
      '/meal-plan/saturday/pick',
      '/meal-plan/sunday/pick',
    ]);
  });
});

function mountMealPlan(assignments: WeekdayAssignments) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka, cheesecake]);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  planWeek(mealPlanStore, assignments);

  TestBed.createComponent(MealPlan);

  return { mealPlanStore };
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

function pickHrefs() {
  return page
    .getByRole('link', { name: 'Pick a recipe' })
    .elements()
    .map((link) => link.getAttribute('href'));
}
