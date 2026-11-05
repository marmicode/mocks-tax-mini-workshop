import { TestBed } from '@angular/core/testing';
import { describe } from 'vitest';
import { verifyRecipeRepositoryContract } from './recipe-repository.contract';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from './recipe-repository.fake';

describe(RecipeRepositoryFake.name, () => {
  verifyRecipeRepositoryContract(createRecipeRepositoryFake);

  function createRecipeRepositoryFake() {
    TestBed.configureTestingModule({
      providers: [provideRecipeRepositoryFake()],
    });
    return { recipeRepository: TestBed.inject(RecipeRepositoryFake) };
  }
});
