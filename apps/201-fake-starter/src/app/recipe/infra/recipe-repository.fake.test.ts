import { TestBed } from '@angular/core/testing';
import { describe } from 'vitest';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { verifyRecipeRepositoryContract } from './recipe-repository.contract';
import { RecipeRepositoryFake } from './recipe-repository.fake';

describe(RecipeRepositoryFake, () => {
  /**
   * @deprecated 🚧 Work in progress.
   */
  async function createRecipeRepositoryFake() {
    throw new Error('🚧 Work in progress!');
  }
});
