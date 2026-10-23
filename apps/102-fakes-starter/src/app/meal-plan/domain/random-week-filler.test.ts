import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import {
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
import { RandomWeekFiller } from './random-week-filler';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

/* A long recipe: 6 steps. */
const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withManySteps()
  .build();

/* A quick recipe: 3 steps. */
const lambKofte = recipeMother
  .withBasicInfo('Lamb Kofte with Yogurt and Sumac')
  .build();

const fullWeek: WeekdayAssignments = {
  monday: 'harissa-chicken',
  tuesday: 'harissa-chicken',
  wednesday: 'harissa-chicken',
  thursday: 'harissa-chicken',
  friday: 'harissa-chicken',
  saturday: 'harissa-chicken',
  sunday: 'harissa-chicken',
};

describe(RandomWeekFiller.name, () => {
  it('picks among every main of the catalog', async () => {
    const { randomWeekFiller } = setUpRandomWeekFiller({
      catalog: [hummus, shakshuka, lambKofte],
    });

    const suggestions = await firstValueFrom(
      randomWeekFiller.fill({ ...fullWeek, sunday: null }),
    );

    expect(suggestions).toEqual({ sunday: shakshuka });
  });

  it('only picks quick recipes when asked', async () => {
    const { randomWeekFiller } = setUpRandomWeekFiller({
      catalog: [hummus, shakshuka, lambKofte],
    });

    const suggestions = await firstValueFrom(
      randomWeekFiller.fill({ ...fullWeek, sunday: null }, { quickOnly: true }),
    );

    expect(suggestions).toEqual({ sunday: lambKofte });
  });

  it('picks a random main for each empty day without repeating it', async () => {
    const { randomWeekFiller, randomAdapterFake } = setUpRandomWeekFiller({
      catalog: [hummus, shakshuka, lambKofte],
    });
    randomAdapterFake.setPickIndex(-1);

    const suggestions = await firstValueFrom(
      randomWeekFiller.fill({ ...fullWeek, saturday: null, sunday: null }),
    );

    expect(suggestions).toEqual({ saturday: lambKofte, sunday: shakshuka });
  });

  it('does not pick recipes that are already planned', async () => {
    const { randomWeekFiller } = setUpRandomWeekFiller({
      catalog: [shakshuka, lambKofte],
    });

    const suggestions = await firstValueFrom(
      randomWeekFiller.fill({
        ...fullWeek,
        monday: shakshuka.id,
        sunday: null,
      }),
    );

    expect(suggestions).toEqual({ sunday: lambKofte });
  });

  it('leaves days empty once mains run out', async () => {
    const { randomWeekFiller } = setUpRandomWeekFiller({
      catalog: [shakshuka],
    });

    const suggestions = await firstValueFrom(
      randomWeekFiller.fill({ ...fullWeek, saturday: null, sunday: null }),
    );

    expect(suggestions).toEqual({ saturday: shakshuka });
  });
});

function setUpRandomWeekFiller({
  catalog = [shakshuka],
}: { catalog?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRandomAdapterFake(), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(catalog);
  const randomAdapterFake = TestBed.inject(RandomAdapterFake);
  const randomWeekFiller = TestBed.inject(RandomWeekFiller);
  return { randomWeekFiller, randomAdapterFake };
}
