import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import {
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
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
  it('picks one recipe of each course', async () => {
    const { menuGenerator } = setUpMenuGenerator();

    const menu = await firstValueFrom(menuGenerator.generate());

    expect(menu).toEqual({
      starter: hummus,
      main: shakshuka,
      dessert: cheesecake,
    });
  });

  it('picks randomly among the recipes of a course', async () => {
    const { menuGenerator, randomAdapterFake } = setUpMenuGenerator();
    randomAdapterFake.setPickIndex(-1);

    const menu = await firstValueFrom(menuGenerator.generate());

    expect(menu).toEqual({
      starter: fritters,
      main: shakshuka,
      dessert: cheesecake,
    });
  });

  it('leaves a course empty when the catalog has no recipe for it', async () => {
    const { menuGenerator } = setUpMenuGenerator({
      recipes: [hummus, shakshuka],
    });

    const menu = await firstValueFrom(menuGenerator.generate());

    expect(menu.dessert).toBeNull();
  });

  it('regenerates a course with another recipe', async () => {
    const { menuGenerator } = setUpMenuGenerator();

    const starter = await firstValueFrom(
      menuGenerator.regenerate('starter', hummus),
    );

    expect(starter).toEqual(fritters);
  });

  it('keeps the current recipe when it is the only one of its course', async () => {
    const { menuGenerator } = setUpMenuGenerator();

    const main = await firstValueFrom(
      menuGenerator.regenerate('main', shakshuka),
    );

    expect(main).toEqual(shakshuka);
  });
});

function setUpMenuGenerator({
  recipes = [hummus, fritters, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake(), provideRandomAdapterFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const randomAdapterFake = TestBed.inject(RandomAdapterFake);
  const menuGenerator = TestBed.inject(MenuGenerator);
  return { menuGenerator, randomAdapterFake };
}
