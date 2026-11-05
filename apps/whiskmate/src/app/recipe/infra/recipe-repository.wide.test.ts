import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe } from 'vitest';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from './recipe-repository';
import { verifyRecipeRepositoryContract } from './recipe-repository.contract';

describe(RecipeRepository.name, () => {
  verifyRecipeRepositoryContract(createRecipeRepository);

  async function createRecipeRepository() {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const recipeRepository = TestBed.inject(RecipeRepository);

    /* Start from an empty catalog. */
    const recipes = await firstValueFrom(
      recipeRepository.search(createRecipeSearchParams()),
    );
    for (const recipe of recipes) {
      await firstValueFrom(recipeRepository.remove({ id: recipe.id }));
    }

    return { recipeRepository };
  }
});
