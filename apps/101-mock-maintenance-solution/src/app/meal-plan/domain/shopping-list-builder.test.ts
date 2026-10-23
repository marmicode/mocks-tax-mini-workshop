import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { ShoppingListBuilder } from './shopping-list-builder';

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
  ingredients: [
    { name: 'Olive oil', quantity: { amount: 2, unit: 'tbsp' } },
    { name: 'tahini', quantity: { amount: 100, unit: 'g' } },
  ],
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

describe(ShoppingListBuilder.name, () => {
  it('does not fetch anything when nothing is planned', async () => {
    const { builder, findById } = setUpShoppingListBuilder();

    const items = await firstValueFrom(builder.build(emptyAssignments));

    expect(findById).not.toHaveBeenCalled();
    expect(items).toEqual([]);
  });

  it('lists the ingredients of a planned recipe sorted by name', async () => {
    const { builder, findById } = setUpShoppingListBuilder();
    findById.mockReturnValue(of(shakshuka));

    const items = await firstValueFrom(
      builder.build({ ...emptyAssignments, monday: 'shakshuka' }),
    );

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(items).toEqual([
      { name: 'fresh coriander, to serve', from: ['Shakshuka'] },
      {
        name: 'large eggs',
        quantity: { amount: 6, unit: '' },
        from: ['Shakshuka'],
      },
      {
        name: 'olive oil',
        quantity: { amount: 3, unit: 'tbsp' },
        from: ['Shakshuka'],
      },
    ]);
  });

  it('merges ingredients with the same name and unit', async () => {
    const { builder, findById } = setUpShoppingListBuilder();
    findById.mockImplementation(({ id }) =>
      of(id === 'shakshuka' ? shakshuka : hummus),
    );

    const items = await firstValueFrom(
      builder.build({
        ...emptyAssignments,
        monday: 'shakshuka',
        tuesday: 'hummus-ful',
      }),
    );

    expect(findById).toHaveBeenCalledTimes(2);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'shakshuka' });
    expect(findById).toHaveBeenNthCalledWith(2, { id: 'hummus-ful' });
    expect(items.find((item) => item.name === 'olive oil')).toEqual({
      name: 'olive oil',
      quantity: { amount: 5, unit: 'tbsp' },
      from: ['Shakshuka', 'Hummus with Ful'],
    });
  });

  it('doubles quantities when a recipe is planned twice', async () => {
    const { builder, findById } = setUpShoppingListBuilder();
    findById.mockReturnValue(of(hummus));

    const items = await firstValueFrom(
      builder.build({
        ...emptyAssignments,
        monday: 'hummus-ful',
        friday: 'hummus-ful',
      }),
    );

    expect(findById).toHaveBeenCalledTimes(2);
    expect(items.find((item) => item.name === 'tahini')).toEqual({
      name: 'tahini',
      quantity: { amount: 200, unit: 'g' },
      from: ['Hummus with Ful'],
    });
  });

  it('skips recipes that no longer exist', async () => {
    const { builder, findById } = setUpShoppingListBuilder();
    findById.mockReturnValue(of(undefined));

    const items = await firstValueFrom(
      builder.build({ ...emptyAssignments, monday: 'missing' }),
    );

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(items).toEqual([]);
  });
});

function setUpShoppingListBuilder() {
  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(undefined));
  const builder = TestBed.inject(ShoppingListBuilder);
  return { builder, findById };
}
