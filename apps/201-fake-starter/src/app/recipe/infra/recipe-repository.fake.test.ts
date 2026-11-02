import { TestBed } from '@angular/core/testing';
import { describe } from 'vitest';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { verifyRecipeRepositoryContract } from './recipe-repository.contract';
import { RecipeRepositoryFake } from './recipe-repository.fake';

describe(RecipeRepositoryFake.name, () => {
  verifyRecipeRepositoryContract(createRecipeRepositoryFake);

  async function createRecipeRepositoryFake() {
    TestBed.configureTestingModule({
      providers: [],
    });
    const recipeRepository = TestBed.inject(RecipeRepositoryFake);
    recipeRepository.configure({
      recipes: [
        recipeMother.withBasicInfo('Burger').build(),
        recipeMother
          .withBasicInfo({ name: 'Hummus', course: 'starter' })
          .build(),
      ],
    });
    return { recipeRepository };
  }
});
