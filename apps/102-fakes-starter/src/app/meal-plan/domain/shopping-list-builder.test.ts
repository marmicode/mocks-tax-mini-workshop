import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { ShoppingListBuilder } from './shopping-list-builder';

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
    { name: 'Olive oil', quantity: { amount: 2, unit: 'tbsp' } },
    { name: 'tahini', quantity: { amount: 100, unit: 'g' } },
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

describe(ShoppingListBuilder.name, () => {
  it('builds an empty list when nothing is planned', async () => {
    const { builder } = setUpShoppingListBuilder();

    const items = await firstValueFrom(builder.build(emptyAssignments));

    expect(items).toEqual([]);
  });

  it('lists the ingredients of a planned recipe sorted by name', async () => {
    const { builder } = setUpShoppingListBuilder();

    const items = await firstValueFrom(
      builder.build({ ...emptyAssignments, monday: shakshuka.id }),
    );

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
    const { builder } = setUpShoppingListBuilder();

    const items = await firstValueFrom(
      builder.build({
        ...emptyAssignments,
        monday: shakshuka.id,
        tuesday: hummus.id,
      }),
    );

    expect(items.find((item) => item.name === 'olive oil')).toEqual({
      name: 'olive oil',
      quantity: { amount: 5, unit: 'tbsp' },
      from: ['Shakshuka', 'Hummus with Ful'],
    });
  });

  it('doubles quantities when a recipe is planned twice', async () => {
    const { builder } = setUpShoppingListBuilder();

    const items = await firstValueFrom(
      builder.build({
        ...emptyAssignments,
        monday: hummus.id,
        friday: hummus.id,
      }),
    );

    expect(items.find((item) => item.name === 'tahini')).toEqual({
      name: 'tahini',
      quantity: { amount: 200, unit: 'g' },
      from: ['Hummus with Ful'],
    });
  });

  it('skips recipes that no longer exist', async () => {
    const { builder } = setUpShoppingListBuilder();

    const items = await firstValueFrom(
      builder.build({ ...emptyAssignments, monday: 'missing' }),
    );

    expect(items).toEqual([]);
  });
});

function setUpShoppingListBuilder() {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka, hummus]);
  const builder = TestBed.inject(ShoppingListBuilder);
  return { builder };
}
