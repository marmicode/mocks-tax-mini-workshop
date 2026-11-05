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
import { ShoppingList } from './shopping-list.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: 'olive oil', quantity: { amount: 3, unit: 'tbsp' } },
    { name: 'large eggs', quantity: { amount: 6, unit: '' } },
    { name: 'fresh coriander, to serve' },
  ],
  steps: [],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'olive oil', quantity: { amount: 2, unit: 'tbsp' } }],
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

describe(ShoppingList, () => {
  it('shows an empty state when nothing is planned', async () => {
    const { findById } = mountShoppingList(emptyAssignments);

    await expect
      .element(page.getByTestId('empty-shopping-list'))
      .toMatchTextContent('Nothing to buy yet');
    expect(findById).not.toHaveBeenCalled();
  });

  it('lists the ingredients of the planned recipes', async () => {
    const { findById } = mountShoppingList({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));

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
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('merges ingredients shared by several recipes', async () => {
    const { findById } = mountShoppingList({
      ...emptyAssignments,
      monday: 'shakshuka',
      tuesday: 'hummus-ful',
    });
    findById.mockImplementation(({ id }) =>
      of(id === 'shakshuka' ? shakshuka : hummus),
    );

    await expect.poll(() => itemLabels()).toContain('5 tbsp olive oil');
    await expect
      .element(page.getByText('for Shakshuka, Hummus with Ful'))
      .toBeVisible();
    expect(findById).toHaveBeenCalledTimes(2);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'shakshuka' });
    expect(findById).toHaveBeenNthCalledWith(2, { id: 'hummus-ful' });
  });

  it('counts down the items left as they are checked', async () => {
    const { findById } = mountShoppingList({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));

    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('3 items left');
    await page
      .getByRole('checkbox', { name: 'fresh coriander, to serve' })
      .click();

    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('2 items left');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('celebrates once every item is checked', async () => {
    const { findById } = mountShoppingList({
      ...emptyAssignments,
      monday: 'hummus-ful',
    });
    findById.mockReturnValue(of(hummus));

    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('1 item left');
    await page.getByRole('checkbox', { name: '2 tbsp olive oil' }).click();

    await expect
      .element(page.getByTestId('items-left'))
      .toHaveTextContent('All done 🎉');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'hummus-ful' });
  });
});

function mountShoppingList(assignments: WeekdayAssignments) {
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

  TestBed.createComponent(ShoppingList);

  return { findById, mealPlanStore };
}

function itemLabels() {
  return page
    .getByTestId('shopping-item')
    .getByRole('checkbox')
    .elements()
    .map((checkbox) => {
      const label = (checkbox as HTMLInputElement).labels?.[0];
      return label?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    });
}
