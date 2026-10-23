import { TestBed } from '@angular/core/testing';
import { describe } from 'vitest';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { verifyRecipeRepositoryContract } from './recipe-repository.contract';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from './recipe-repository.fake';

describe(RecipeRepositoryFake.name, () => {
  verifyRecipeRepositoryContract(createRecipeRepositoryFake);

  function createRecipeRepositoryFake({ recipes }: { recipes: Recipe[] }) {
    TestBed.configureTestingModule({
      providers: [provideRecipeRepositoryFake()],
    });
    const recipeRepository = TestBed.inject(RecipeRepositoryFake);
    recipeRepository.setRecipes(recipes);
    return { recipeRepository };
  }
});
