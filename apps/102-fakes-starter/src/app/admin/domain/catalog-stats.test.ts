import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { CatalogStats } from './catalog-stats';

const hummus = recipeMother
  .withBasicInfo({
    name: 'Hummus with Ful',
    course: 'starter',
    description: 'Creamy hummus.',
  })
  .withSomeIngredients()
  .withSomeSteps()
  .build();

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withSomeIngredients()
  .withSomeSteps()
  .build();

const kofte = recipeMother
  .withBasicInfo({ name: 'Lamb Kofte', description: '   ' })
  .withSomeIngredients()
  .withSomeSteps()
  .build();

const stew = recipeMother
  .withBasicInfo('Slow-cooked Lamb Stew')
  .withManyIngredients()
  .withManySteps()
  .build();

describe(CatalogStats.name, () => {
  it('counts recipes per course', async () => {
    const { catalogStats } = setUpCatalogStats([hummus, shakshuka, kofte]);

    const stats = await firstValueFrom(catalogStats.stats());

    expect(stats.recipeCount).toBe(3);
    expect(stats.countByCourse).toEqual({ starter: 1, main: 2, dessert: 0 });
  });

  it('computes average ingredient and step counts', async () => {
    const { catalogStats } = setUpCatalogStats([hummus, shakshuka, kofte]);

    const stats = await firstValueFrom(catalogStats.stats());

    expect(stats.averageIngredientCount).toBe(3);
    expect(stats.averageStepCount).toBe(3);
  });

  it('counts recipes with a missing or blank description', async () => {
    const { catalogStats } = setUpCatalogStats([hummus, shakshuka, kofte]);

    const stats = await firstValueFrom(catalogStats.stats());

    expect(stats.missingDescriptionCount).toBe(2);
  });

  it('returns zeros for an empty catalog', async () => {
    const { catalogStats } = setUpCatalogStats([]);

    const stats = await firstValueFrom(catalogStats.stats());

    expect(stats).toEqual({
      recipeCount: 0,
      countByCourse: { starter: 0, main: 0, dessert: 0 },
      averageIngredientCount: 0,
      averageStepCount: 0,
      missingDescriptionCount: 0,
    });
  });

  it('computes fractional averages', async () => {
    const { catalogStats } = setUpCatalogStats([hummus, stew]);

    const stats = await firstValueFrom(catalogStats.stats());

    expect(stats.averageIngredientCount).toBe(5.5);
    expect(stats.averageStepCount).toBe(5.5);
  });

  it('summarizes a single described recipe', async () => {
    const { catalogStats } = setUpCatalogStats([hummus]);

    const stats = await firstValueFrom(catalogStats.stats());

    expect(stats).toEqual({
      recipeCount: 1,
      countByCourse: { starter: 1, main: 0, dessert: 0 },
      averageIngredientCount: 3,
      averageStepCount: 3,
      missingDescriptionCount: 0,
    });
  });

  it('reflects catalog changes every time stats are requested', async () => {
    const { catalogStats, recipeRepositoryFake } = setUpCatalogStats([kofte]);

    const statsBefore = await firstValueFrom(catalogStats.stats());
    recipeRepositoryFake.setRecipes([kofte, hummus]);
    const statsAfter = await firstValueFrom(catalogStats.stats());

    expect(statsBefore.recipeCount).toBe(1);
    expect(statsAfter.recipeCount).toBe(2);
  });
});

function setUpCatalogStats(recipes: Recipe[]) {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);
  const catalogStats = TestBed.inject(CatalogStats);
  return { catalogStats, recipeRepositoryFake };
}
