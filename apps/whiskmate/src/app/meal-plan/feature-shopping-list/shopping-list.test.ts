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
import { ShoppingList } from './shopping-list.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: 'olive oil', quantity: { amount: 3, unit: 'tbsp' } },
    { name: 'large eggs', quantity: { amount: 6, unit: '' } },
    { name: 'fresh coriander, to serve' },
  ])
  .build();

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([
    { name: 'olive oil', quantity: { amount: 2, unit: 'tbsp' } },
  ])
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

describe(ShoppingList, () => {
  it('shows an empty state when nothing is planned', async () => {
    mountShoppingList(emptyAssignments);

    await expect
      .element(page.getByTestId('empty-shopping-list'))
      .toMatchTextContent('Nothing to buy yet');
  });

  it('lists the ingredients of the planned recipes', async () => {
    mountShoppingList({
      ...emptyAssignments,
      monday: shakshuka.id,
    });

    await expect
      .poll(() => itemLabels())
      .toEqual([
        'fresh coriander, to serve',
        '6 large eggs',
        '3 tbsp olive oil',
      ]);
    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('3 items left');
  });

  it('merges ingredients shared by several recipes', async () => {
    mountShoppingList({
      ...emptyAssignments,
      monday: shakshuka.id,
      tuesday: hummus.id,
    });

    await expect.poll(() => itemLabels()).toContain('5 tbsp olive oil');
    await expect
      .element(
        page.getByText('for Shakshuka, Hummus with Ful', { exact: true }),
      )
      .toBeVisible();
  });

  it('counts down the items left as they are checked', async () => {
    mountShoppingList({
      ...emptyAssignments,
      monday: shakshuka.id,
    });

    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('3 items left');
    await page
      .getByRole('checkbox', { name: 'fresh coriander, to serve' })
      .click();

    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('2 items left');
  });

  it('celebrates once every item is checked', async () => {
    mountShoppingList({
      ...emptyAssignments,
      monday: hummus.id,
    });

    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('1 item left');
    await page.getByRole('checkbox', { name: '2 tbsp olive oil' }).click();

    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('All done 🎉');
  });
});

function mountShoppingList(assignments: WeekdayAssignments) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka, hummus]);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  planWeek(mealPlanStore, assignments);

  TestBed.createComponent(ShoppingList);
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

function itemLabels() {
  return page
    .getByTestId('shopping-item')
    .elements()
    .map((item) =>
      [...item.getElementsByTagName('label')]
        .map((label) => label.textContent?.trim() ?? '')
        .join(''),
    );
}
