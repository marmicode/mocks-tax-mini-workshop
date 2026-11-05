import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RandomAdapter } from '@whiskmate/shared/infra';
import { RandomWeekFiller } from './random-week-filler';

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

const lambKofte: Recipe = {
  id: 'lamb-kofte',
  course: 'main',
  name: 'Lamb Kofte with Yogurt and Sumac',
  description: null,
  pictureUri: 'https://example.com/lamb-kofte.jpg',
  ingredients: [],
  steps: [],
};

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
  it('searches every recipe of the catalog', async () => {
    const { randomWeekFiller, search } = setUpRandomWeekFiller();

    await firstValueFrom(randomWeekFiller.fill({ ...fullWeek, sunday: null }));

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('only searches quick recipes when asked', async () => {
    const { randomWeekFiller, search } = setUpRandomWeekFiller();

    await firstValueFrom(
      randomWeekFiller.fill({ ...fullWeek, sunday: null }, { quickOnly: true }),
    );

    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": 4,
          },
        ],
      ]
    `);
  });

  it('picks a random main for each empty day without repeating it', async () => {
    const { randomWeekFiller, search, pick } = setUpRandomWeekFiller({
      catalog: [hummus, shakshuka, lambKofte],
    });
    pick.mockImplementation((recipes) => recipes.at(-1));

    const suggestions = await firstValueFrom(
      randomWeekFiller.fill({ ...fullWeek, saturday: null, sunday: null }),
    );

    expect(pick).toHaveBeenNthCalledWith(1, [shakshuka, lambKofte]);
    expect(pick).toHaveBeenNthCalledWith(2, [shakshuka]);
    expect(suggestions).toEqual({ saturday: lambKofte, sunday: shakshuka });
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('does not pick recipes that are already planned', async () => {
    const { randomWeekFiller, search, pick } = setUpRandomWeekFiller();
    search.mockImplementation((params) =>
      of(isWholeCatalogSearch(params) ? [shakshuka, lambKofte] : []),
    );

    const suggestions = await firstValueFrom(
      randomWeekFiller.fill({
        ...fullWeek,
        monday: 'shakshuka',
        sunday: null,
      }),
    );

    expect(pick).toHaveBeenCalledExactlyOnceWith([lambKofte]);
    expect(suggestions).toEqual({ sunday: lambKofte });
  });

  it('leaves days empty once mains run out', async () => {
    const { randomWeekFiller, search } = setUpRandomWeekFiller({
      catalog: [shakshuka],
    });

    const suggestions = await firstValueFrom(
      randomWeekFiller.fill({ ...fullWeek, saturday: null, sunday: null }),
    );

    expect(suggestions).toEqual({ saturday: shakshuka });
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });
});

function setUpRandomWeekFiller({
  catalog = [shakshuka],
}: { catalog?: Recipe[] } = {}) {
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation(({ courses }) => {
      /* The filler picks mains itself, it never asks for a course. */
      if (courses != null) {
        throw new Error('Invalid call');
      }
      return of(catalog);
    });
  const pick = vi
    .spyOn(TestBed.inject(RandomAdapter), 'pick')
    .mockImplementation((items) => items[0]);
  const randomWeekFiller = TestBed.inject(RandomWeekFiller);
  return { randomWeekFiller, search, pick };
}

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    Object.keys(params).length === 3 &&
    Object.values(params).every((value) => value === '' || value === null)
  );
}
