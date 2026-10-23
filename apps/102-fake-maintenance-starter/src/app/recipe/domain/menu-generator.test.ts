import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import {
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
import { MenuGenerator } from './menu-generator';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const fritters = recipeMother
  .withBasicInfo({ name: 'Courgette and Herb Fritters', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(MenuGenerator.name, () => {
  it('searches recipes for each course', async () => {
    const { menuGenerator } = setUpMenuGenerator();

    const menu = await firstValueFrom(menuGenerator.generate());

    expect(menu).toEqual({
      starter: hummus,
      main: shakshuka,
      dessert: cheesecake,
    });
  });

  it('picks one recipe per course', async () => {
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
