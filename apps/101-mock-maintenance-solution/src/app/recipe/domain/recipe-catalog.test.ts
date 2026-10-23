import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
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
    search.mockImplementation(({ courses }) => {
      const catalog = [hummus, shakshuka, cheesecake];
      return of(
        courses.length > 0
          ? catalog.filter((recipe) => courses.includes(recipe.course))
          : catalog,
      );
    });

    const count = await firstValueFrom(recipeCatalog.countAll());

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
      courses: [],
    });
    expect(count).toBe(0);
  });

  it('lists recipe names alphabetically', async () => {
    const { recipeCatalog, search } = setUpRecipeCatalog();
    search.mockImplementation((params) =>
      Object.keys(params).length === 4
        ? of([shakshuka, hummus, cheesecake])
        : throwError(
            () => new Error(`unexpected search ${JSON.stringify(params)}`),
          ),
    );

    const names = await firstValueFrom(recipeCatalog.listNames());

    expect(search.mock.calls).toMatchSnapshot();
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
      courses: [],
    });
    expect(names).toEqual(['Shakshuka']);
  });

  it('lists the recipes of a course', async () => {
    const { recipeCatalog, search } = setUpRecipeCatalog();
    search.mockImplementation((params) => {
      const catalog = [hummus, shakshuka, cheesecake];
      return of(
        params.courses.length > 0
          ? catalog.filter((recipe) => params.courses?.includes(recipe.course))
          : catalog,
      );
    });

    const recipes = await firstValueFrom(recipeCatalog.listByCourse('main'));

    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/recipe-catalog-by-course.calls.json',
    );
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
