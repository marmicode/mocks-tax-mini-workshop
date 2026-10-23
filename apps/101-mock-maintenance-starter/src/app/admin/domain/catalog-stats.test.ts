import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { CatalogStats } from './catalog-stats';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: 'Creamy hummus.',
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
  steps: ['Blend.'],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }, { name: 'peppers' }],
  steps: ['Cook the sauce.', 'Poach the eggs.', 'Serve.'],
};

const kofte: Recipe = {
  id: 'lamb-kofte',
  course: 'main',
  name: 'Lamb Kofte',
  description: '   ',
  pictureUri: 'https://example.com/kofte.jpg',
  ingredients: [{ name: 'lamb' }],
  steps: ['Shape.', 'Grill.'],
};

describe(CatalogStats.name, () => {
  it('searches the whole catalog', async () => {
    const { catalogStats, search } = setUpCatalogStats();

    await firstValueFrom(catalogStats.stats());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('counts recipes per course', async () => {
    const { catalogStats, search } = setUpCatalogStats();
    search.mockReturnValue(of([hummus, shakshuka, kofte]));

    const stats = await firstValueFrom(catalogStats.stats());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(stats.recipeCount).toBe(3);
    expect(stats.countByCourse).toEqual({ starter: 1, main: 2, dessert: 0 });
  });

  it('computes average ingredient and step counts', async () => {
    const { catalogStats, search } = setUpCatalogStats();
    search.mockReturnValue(of([hummus, shakshuka, kofte]));

    const stats = await firstValueFrom(catalogStats.stats());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(stats.averageIngredientCount).toBe(2);
    expect(stats.averageStepCount).toBe(2);
  });

  it('counts recipes with a missing or blank description', async () => {
    const { catalogStats, search } = setUpCatalogStats();
    search.mockReturnValue(of([hummus, shakshuka, kofte]));

    const stats = await firstValueFrom(catalogStats.stats());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(stats.missingDescriptionCount).toBe(2);
  });

  it('returns zeros for an empty catalog', async () => {
    const { catalogStats, search } = setUpCatalogStats();
    search.mockReturnValue(of([]));

    const stats = await firstValueFrom(catalogStats.stats());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(stats).toEqual({
      recipeCount: 0,
      countByCourse: { starter: 0, main: 0, dessert: 0 },
      averageIngredientCount: 0,
      averageStepCount: 0,
      missingDescriptionCount: 0,
    });
  });

  it('computes fractional averages', async () => {
    const { catalogStats, search } = setUpCatalogStats();
    search.mockReturnValue(of([hummus, shakshuka]));

    const stats = await firstValueFrom(catalogStats.stats());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(stats.averageIngredientCount).toBe(2.5);
    expect(stats.averageStepCount).toBe(2);
  });

  it('summarizes a single described recipe', async () => {
    const { catalogStats, search } = setUpCatalogStats();
    search.mockReturnValue(of([hummus]));

    const stats = await firstValueFrom(catalogStats.stats());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(stats).toEqual({
      recipeCount: 1,
      countByCourse: { starter: 1, main: 0, dessert: 0 },
      averageIngredientCount: 2,
      averageStepCount: 1,
      missingDescriptionCount: 0,
    });
  });

  it('searches the catalog again every time stats are requested', async () => {
    const { catalogStats, search } = setUpCatalogStats();
    search.mockReturnValue(of([kofte]));

    await firstValueFrom(catalogStats.stats());
    const stats = await firstValueFrom(catalogStats.stats());

    expect(search.mock.calls).toEqual([
      [{ keywords: '', maxIngredientCount: null, maxStepCount: null }],
      [{ keywords: '', maxIngredientCount: null, maxStepCount: null }],
    ]);
    expect(stats.recipeCount).toBe(1);
  });
});

function setUpCatalogStats() {
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));
  const catalogStats = TestBed.inject(CatalogStats);
  return { catalogStats, search };
}
