import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { App } from './app';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(App, () => {
  it('searches all recipes', async () => {
    mountApp();

    await expect
      .poll(recipeNames)
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);
  });
});

function mountApp() {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).configure({
    recipes: [shakshuka, cheesecake],
  });

  TestBed.createComponent(App);
}

function recipeNames() {
  return page
    .getByRole('heading')
    .elements()
    .map((element) => element.textContent?.trim() ?? '');
}
