import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeCatalog } from './recipe-catalog';

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

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeCatalog.name, () => {
  it('counts every recipe of the catalog', async () => {
    const { recipeCatalog, search } = setUpRecipeCatalog();
    search.mockReturnValue(of([hummus, shakshuka, cheesecake]));

    const count = await firstValueFrom(recipeCatalog.countAll());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(count).toBe(3);
  });

  it('counts zero when the catalog is empty', async () => {
    const { recipeCatalog, search } = setUpRecipeCatalog();
    search.mockReturnValue(of([]));

    const count = await firstValueFrom(recipeCatalog.countAll());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(count).toBe(0);
  });

  it('lists recipe names alphabetically', async () => {
    const { recipeCatalog, search } = setUpRecipeCatalog();
    search.mockReturnValue(of([shakshuka, hummus, cheesecake]));

    const names = await firstValueFrom(recipeCatalog.listNames());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(names).toEqual([
      'Hummus with Ful',
      'Lemon and Ricotta Cheesecake',
      'Shakshuka',
    ]);
  });

  it('lists each recipe name once', async () => {
    const { recipeCatalog, search } = setUpRecipeCatalog();
    search.mockReturnValue(
      of([shakshuka, { ...shakshuka, id: 'shakshuka-2' }]),
    );

    const names = await firstValueFrom(recipeCatalog.listNames());

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(names).toEqual(['Shakshuka']);
  });

  it('lists the recipes of a course', async () => {
    const { recipeCatalog, search } = setUpRecipeCatalog();
    search.mockReturnValue(of([hummus, shakshuka, cheesecake]));

    const recipes = await firstValueFrom(recipeCatalog.listByCourse('main'));

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipes).toEqual([shakshuka]);
  });
});

function setUpRecipeCatalog() {
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));
  const recipeCatalog = TestBed.inject(RecipeCatalog);
  return { recipeCatalog, search };
}
