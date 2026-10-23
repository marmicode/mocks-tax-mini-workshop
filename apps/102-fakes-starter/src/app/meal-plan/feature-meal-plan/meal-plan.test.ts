import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

describe(MealPlan.name, () => {
  it('shows every day as empty when nothing is planned', async () => {
    const { fixture } = mountMealPlan(emptyAssignments);
    await fixture.whenStable();

    expect(dayElements(fixture.nativeElement)).toHaveLength(7);
    for (const day of dayElements(fixture.nativeElement)) {
      expect(day.textContent?.toLowerCase()).toContain('no recipe is planned');
    }
  });

  it('shows the planned recipe', async () => {
    const { fixture } = mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
    });
    await fixture.whenStable();

    const [monday] = dayElements(fixture.nativeElement);
    expect(monday?.textContent).toContain('Shakshuka');
  });

  it('shows each planned recipe', async () => {
    const { fixture } = mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
      friday: cheesecake.id,
    });
    await fixture.whenStable();

    const [monday, , , , friday] = dayElements(fixture.nativeElement);
    expect(monday?.textContent).toContain('Shakshuka');
    expect(friday?.textContent).toContain('Lemon and Ricotta Cheesecake');
  });

  it('shows the name and picture of a planned recipe', async () => {
    const { fixture } = mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
    });
    await fixture.whenStable();

    const [monday, ...otherDays] = dayElements(fixture.nativeElement);
    expect(monday?.textContent).toContain('Shakshuka');
    expect(monday?.querySelector('img')?.getAttribute('src')).toBe(
      shakshuka.pictureUri,
    );
    for (const day of otherDays) {
      expect(day.textContent?.toLowerCase()).toContain('no recipe is planned');
    }
  });

  it('renders a missing recipe as an empty day', async () => {
    const { fixture } = mountMealPlan({
      ...emptyAssignments,
      monday: 'missing',
    });
    await fixture.whenStable();

    const [monday] = dayElements(fixture.nativeElement);
    expect(monday?.textContent).toContain('Monday');
    expect(monday?.textContent?.toLowerCase()).toContain(
      'no recipe is planned',
    );
  });

  it('clears a day', async () => {
    const { fixture, mealPlanStore } = mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
    });
    await fixture.whenStable();

    fixture.nativeElement.querySelector('button')?.click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments().monday).toBeNull();
    const [monday] = dayElements(fixture.nativeElement);
    expect(monday?.textContent?.toLowerCase()).toContain(
      'no recipe is planned',
    );
  });

  it('links each empty day to the recipe picker', async () => {
    const { fixture } = mountMealPlan({
      ...emptyAssignments,
      monday: shakshuka.id,
    });
    await fixture.whenStable();

    const pickLinks = [...fixture.nativeElement.querySelectorAll('a')].filter(
      (el) => el.textContent?.trim() === 'Pick a recipe',
    );
    expect(pickLinks.map((el) => el.getAttribute('href'))).toEqual([
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

  const fixture = TestBed.createComponent(MealPlan);

  return { fixture, mealPlanStore };
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

function dayElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('wm-meal-plan-day')];
}
