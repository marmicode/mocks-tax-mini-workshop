import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
import { MealPlan } from './meal-plan.ng';

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
  it('does not fetch any recipe when nothing is planned', async () => {
    const { findById } = mountMealPlan(emptyAssignments);

    await expect
      .poll(() => page.getByText('No recipe is planned').length)
      .toBe(7);
    expect(findById).not.toHaveBeenCalled();
  });

  it('fetches the planned recipe by id', async () => {
    const { findById } = mountMealPlan({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));

    await expect
      .poll(() => findById)
      .toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('fetches each planned recipe', async () => {
    const { findById } = mountMealPlan({
      ...emptyAssignments,
      monday: 'shakshuka',
      friday: 'lemon-ricotta-cheesecake',
    });
    findById.mockImplementation(({ id }) =>
      of(id === 'shakshuka' ? shakshuka : cheesecake),
    );

    await expect.poll(() => findById).toHaveBeenCalledTimes(2);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'shakshuka' });
    expect(findById).toHaveBeenNthCalledWith(2, {
      id: 'lemon-ricotta-cheesecake',
    });
  });

  it('shows the name and picture of a planned recipe', async () => {
    const { findById } = mountMealPlan({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));

    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toBeVisible();
    expect(
      page
        .getByRole('img', { name: 'Shakshuka' })
        .element()
        .getAttribute('src'),
    ).toBe('https://example.com/shakshuka.jpg');
    await expect
      .poll(() => page.getByText('No recipe is planned').length)
      .toBe(6);
    expect(findById).toHaveBeenCalledWith({ id: 'shakshuka' });
  });

  it('renders a missing recipe as an empty day', async () => {
    const { findById } = mountMealPlan({
      ...emptyAssignments,
      monday: 'missing',
    });
    findById.mockReturnValue(of(undefined));

    await expect
      .element(page.getByText('Monday'))
      .toBeVisible();
    await expect
      .poll(() => findById)
      .toHaveBeenCalledWith({ id: 'missing' });
    await expect
      .poll(() => page.getByText('No recipe is planned').length)
      .toBe(7);
  });

  it('clears a day', async () => {
    const { findById, mealPlanStore } = mountMealPlan({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));
    const clear = vi
      .spyOn(mealPlanStore, 'clear')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Remove' }).click();

    await expect
      .poll(() => clear)
      .toHaveBeenCalledExactlyOnceWith({ weekday: 'monday' });
    expect(findById).toHaveBeenCalledWith({ id: 'shakshuka' });
  });

  it('links each empty day to the recipe picker', async () => {
    const { findById } = mountMealPlan({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));

    await expect.poll(() => pickHrefs()).toEqual([
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
      {
        provide: LocalStorage,
        useValue: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
        },
      },
    ],
  });

  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(undefined));
  const mealPlanStore = TestBed.inject(MealPlanStore);
  vi.spyOn(mealPlanStore, 'assignments').mockReturnValue(assignments);

  TestBed.createComponent(MealPlan);

  return { findById, mealPlanStore };
}

function pickHrefs() {
  return page
    .getByRole('link', { name: 'Pick a recipe' })
    .elements()
    .map((link) => link.getAttribute('href'));
}
