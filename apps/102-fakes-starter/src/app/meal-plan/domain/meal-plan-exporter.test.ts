import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { MealPlanExporter } from './meal-plan-exporter';

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

describe(MealPlanExporter.name, () => {
  it('exports an empty week', async () => {
    const { exporter } = setUpMealPlanExporter();

    const text = await firstValueFrom(exporter.toText(emptyAssignments));

    expect(text).toBe(
      [
        'Monday: —',
        'Tuesday: —',
        'Wednesday: —',
        'Thursday: —',
        'Friday: —',
        'Saturday: —',
        'Sunday: —',
      ].join('\n'),
    );
  });

  it('exports the name of each planned recipe', async () => {
    const { exporter } = setUpMealPlanExporter();

    const text = await firstValueFrom(
      exporter.toText({
        ...emptyAssignments,
        monday: 'shakshuka',
        sunday: 'lemon-ricotta-cheesecake',
      }),
    );

    expect(text.split('\n')).toEqual([
      'Monday: Shakshuka',
      'Tuesday: —',
      'Wednesday: —',
      'Thursday: —',
      'Friday: —',
      'Saturday: —',
      'Sunday: Lemon and Ricotta Cheesecake',
    ]);
  });

  it('exports a missing recipe as an empty day', async () => {
    const { exporter } = setUpMealPlanExporter();

    const text = await firstValueFrom(
      exporter.toText({ ...emptyAssignments, tuesday: 'missing' }),
    );

    expect(text.split('\n')[1]).toBe('Tuesday: —');
  });
});

function setUpMealPlanExporter() {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka, cheesecake]);
  const exporter = TestBed.inject(MealPlanExporter);
  return { exporter };
}
