import { TestBed } from '@angular/core/testing';
import { describe } from 'vitest';
import { RecipeRepository } from './recipe-repository';
import { verifyRecipeRepositoryContract } from './recipe-repository.contract';

describe(RecipeRepository.name, () => {
  verifyRecipeRepositoryContract(createRecipeRepository);

  async function createRecipeRepository() {
    return { recipeRepository: TestBed.inject(RecipeRepository) };
  }
});
