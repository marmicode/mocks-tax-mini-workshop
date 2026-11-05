import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RandomAdapter } from '@whiskmate/shared/infra';
import { MenuGenerator } from './menu-generator';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const fritters: Recipe = {
  id: 'courgette-fritters',
  course: 'starter',
  name: 'Courgette and Herb Fritters',
  description: null,
  pictureUri: 'https://example.com/fritters.jpg',
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

describe(MenuGenerator.name, () => {
  it('searches recipes for each course', async () => {
    const { menuGenerator, search } = setUpMenuGenerator();

    await firstValueFrom(menuGenerator.generate());

    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('picks one recipe per course', async () => {
    const { menuGenerator, pick } = setUpMenuGenerator();
    pick.mockImplementation((recipes) => recipes.at(-1));

    const menu = await firstValueFrom(menuGenerator.generate());

    expect(pick).toHaveBeenCalledWith([hummus, fritters]);
    expect(menu).toEqual({
      starter: fritters,
      main: shakshuka,
      dessert: cheesecake,
    });
  });

  it('leaves a course empty when the catalog has no recipe for it', async () => {
    const { menuGenerator, search } = setUpMenuGenerator();
    search.mockImplementation(({ courses }) =>
      of(courses?.includes('dessert') ? [] : [shakshuka]),
    );

    const menu = await firstValueFrom(menuGenerator.generate());

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
    expect(menu.dessert).toBeNull();
  });

  it('regenerates a course with another recipe', async () => {
    const { menuGenerator, search, pick } = setUpMenuGenerator();

    const starter = await firstValueFrom(
      menuGenerator.regenerate('starter', hummus),
    );

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
    expect(pick).toHaveBeenCalledExactlyOnceWith([fritters]);
    expect(starter).toEqual(fritters);
  });

  it('keeps the current recipe when it is the only one of its course', async () => {
    const { menuGenerator, search, pick } = setUpMenuGenerator();

    const main = await firstValueFrom(
      menuGenerator.regenerate('main', shakshuka),
    );

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(pick).not.toHaveBeenCalled();
    expect(main).toEqual(shakshuka);
  });
});

function setUpMenuGenerator() {
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation(({ courses }) =>
      of(
        [hummus, fritters, shakshuka, cheesecake].filter((recipe) =>
          courses?.includes(recipe.course),
        ),
      ),
    );
  const pick = vi
    .spyOn(TestBed.inject(RandomAdapter), 'pick')
    .mockImplementation((items) => items[0]);
  const menuGenerator = TestBed.inject(MenuGenerator);
  return { menuGenerator, search, pick };
}
