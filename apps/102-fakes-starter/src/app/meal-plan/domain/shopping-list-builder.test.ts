import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
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
  it('builds an empty list when nothing is planned', async () => {
    const { builder } = setUpShoppingListBuilder();

    const items = await firstValueFrom(builder.build(emptyAssignments));

    expect(items).toEqual([]);
  });

  it('lists the ingredients of a planned recipe sorted by name', async () => {
    const { builder } = setUpShoppingListBuilder();

    const items = await firstValueFrom(
      builder.build({ ...emptyAssignments, monday: 'shakshuka' }),
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
        monday: 'shakshuka',
        tuesday: 'hummus-ful',
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
        monday: 'hummus-ful',
        friday: 'hummus-ful',
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
