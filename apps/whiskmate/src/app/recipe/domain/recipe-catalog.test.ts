import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { RecipeCatalog } from './recipe-catalog';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(RecipeCatalog.name, () => {
  it('counts every recipe of the catalog', async () => {
    const { recipeCatalog } = setUpRecipeCatalog([
      hummus,
      shakshuka,
      cheesecake,
    ]);

    const count = await firstValueFrom(recipeCatalog.countAll());

    expect(count).toBe(3);
  });

  it('counts zero when the catalog is empty', async () => {
    const { recipeCatalog } = setUpRecipeCatalog([]);

    const count = await firstValueFrom(recipeCatalog.countAll());

    expect(count).toBe(0);
  });

  it('lists recipe names alphabetically', async () => {
    const { recipeCatalog } = setUpRecipeCatalog([
      shakshuka,
      hummus,
      cheesecake,
    ]);

    const names = await firstValueFrom(recipeCatalog.listNames());

    expect(names).toEqual([
      'Hummus with Ful',
      'Lemon and Ricotta Cheesecake',
      'Shakshuka',
    ]);
  });

  it('lists each recipe name once', async () => {
    const { recipeCatalog } = setUpRecipeCatalog([
      shakshuka,
      recipeMother.withBasicInfo('Shakshuka').withId('shakshuka-2').build(),
    ]);

    const names = await firstValueFrom(recipeCatalog.listNames());

    expect(names).toEqual(['Shakshuka']);
  });

  it('lists the recipes of a course', async () => {
    const { recipeCatalog } = setUpRecipeCatalog([
      hummus,
      shakshuka,
      cheesecake,
    ]);

    const recipes = await firstValueFrom(recipeCatalog.listByCourse('main'));

    expect(recipes).toEqual([shakshuka]);
  });
});

function setUpRecipeCatalog(recipes: Recipe[]) {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const recipeCatalog = TestBed.inject(RecipeCatalog);
  return { recipeCatalog };
}
