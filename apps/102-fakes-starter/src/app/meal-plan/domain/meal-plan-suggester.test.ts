import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { MealPlanSuggester } from './meal-plan-suggester';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const harissaChicken: Recipe = {
  id: 'harissa-chicken',
  course: 'main',
  name: 'Harissa-Roasted Chicken',
  description: null,
  pictureUri: 'https://example.com/harissa-chicken.jpg',
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

describe(MealPlanSuggester.name, () => {
  it('only suggests mains', async () => {
    const { suggester } = setUpMealPlanSuggester([hummus]);

    const suggestions = await firstValueFrom(
      suggester.suggest(emptyAssignments),
    );

    expect(suggestions).toEqual({});
  });

  it('fills every empty weekday round-robin', async () => {
    const { suggester } = setUpMealPlanSuggester([
      hummus,
      shakshuka,
      harissaChicken,
    ]);

    const suggestions = await firstValueFrom(
      suggester.suggest(emptyAssignments),
    );

    expect(suggestions).toEqual({
      monday: shakshuka,
      tuesday: harissaChicken,
      wednesday: shakshuka,
      thursday: harissaChicken,
      friday: shakshuka,
      saturday: harissaChicken,
      sunday: shakshuka,
    });
  });

  it('does not suggest anything for planned weekdays', async () => {
    const { suggester } = setUpMealPlanSuggester([shakshuka, harissaChicken]);

    const suggestions = await firstValueFrom(
      suggester.suggest({
        monday: 'lamb-kofte',
        tuesday: 'lamb-kofte',
        wednesday: 'lamb-kofte',
        thursday: 'lamb-kofte',
        friday: 'lamb-kofte',
        saturday: null,
        sunday: null,
      }),
    );

    expect(suggestions).toEqual({
      saturday: shakshuka,
      sunday: harissaChicken,
    });
  });

  it('does not suggest recipes that are already planned', async () => {
    const { suggester } = setUpMealPlanSuggester([shakshuka, harissaChicken]);

    const suggestions = await firstValueFrom(
      suggester.suggest({ ...emptyAssignments, monday: 'shakshuka' }),
    );

    expect(Object.values(suggestions)).not.toContain(shakshuka);
    expect(suggestions.tuesday).toEqual(harissaChicken);
  });

  it('suggests nothing when there is no main left', async () => {
    const { suggester } = setUpMealPlanSuggester([shakshuka]);

    const suggestions = await firstValueFrom(
      suggester.suggest({ ...emptyAssignments, monday: 'shakshuka' }),
    );

    expect(suggestions).toEqual({});
  });
});

function setUpMealPlanSuggester(recipes: Recipe[]) {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const suggester = TestBed.inject(MealPlanSuggester);
  return { suggester };
}
