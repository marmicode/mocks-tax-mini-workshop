import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe(ShoppingList.name, () => {
  it('shows an empty state when nothing is planned', async () => {
    const { fixture, findById } = mountShoppingList(emptyAssignments);
    await fixture.whenStable();

    expect(findById).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="empty-shopping-list"]')
        ?.textContent,
    ).toContain('Nothing to buy yet');
  });

  it('lists the ingredients of the planned recipes', async () => {
    const { fixture, findById } = mountShoppingList({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(itemLabels(fixture.nativeElement)).toEqual([
      'fresh coriander, to serve',
      '6 large eggs',
      '3 tbsp olive oil',
    ]);
    expect(itemsLeft(fixture.nativeElement)).toBe('3 items left');
  });

  it('merges ingredients shared by several recipes', async () => {
    const { fixture, findById } = mountShoppingList({
      ...emptyAssignments,
      monday: 'shakshuka',
      tuesday: 'hummus-ful',
    });
    findById.mockImplementation(({ id }) =>
      of(id === 'shakshuka' ? shakshuka : hummus),
    );
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledTimes(2);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'shakshuka' });
    expect(findById).toHaveBeenNthCalledWith(2, { id: 'hummus-ful' });
    expect(itemLabels(fixture.nativeElement)).toContain('5 tbsp olive oil');
    expect(fixture.nativeElement.textContent).toContain(
      'for Shakshuka, Hummus with Ful',
    );
  });

  it('counts down the items left as they are checked', async () => {
    const { fixture, findById } = mountShoppingList({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));
    await fixture.whenStable();

    checkboxes(fixture.nativeElement)[0]?.click();
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(itemsLeft(fixture.nativeElement)).toBe('2 items left');
  });

  it('celebrates once every item is checked', async () => {
    const { fixture, findById } = mountShoppingList({
      ...emptyAssignments,
      monday: 'hummus-ful',
    });
    findById.mockReturnValue(of(hummus));
    await fixture.whenStable();

    checkboxes(fixture.nativeElement)[0]?.click();
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'hummus-ful' });
    expect(itemsLeft(fixture.nativeElement)).toBe('All done 🎉');
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

  const fixture = TestBed.createComponent(ShoppingList);

  return { fixture, findById, mealPlanStore };
}

function itemLabels(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="shopping-item"] label')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function itemsLeft(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="items-left"]')?.textContent?.trim();
}

function checkboxes(root: HTMLElement): HTMLInputElement[] {
  return [
    ...root.querySelectorAll<HTMLInputElement>(
      '[data-testid="shopping-item"] input[type="checkbox"]',
    ),
  ];
}
