import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { describe } from 'vitest';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from './recipe-repository';
import { verifyRecipeRepositoryContract } from './recipe-repository.contract';

const RECIPES_URL = 'http://localhost:3333/api/recipes';

describe(RecipeRepository.name, () => {
  verifyRecipeRepositoryContract(createRecipeRepository);

  async function createRecipeRepository({ recipes }: { recipes: Recipe[] }) {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    await resetCatalog(recipes);
    return { recipeRepository: TestBed.inject(RecipeRepository) };
  }
});

/**
 * The API has no reset endpoint, so the catalog is emptied
 * before the given recipes are added.
 */
async function resetCatalog(recipes: Recipe[]): Promise<void> {
  const existingRecipes = await requestJson<Recipe[]>(`${RECIPES_URL}/search`, {
    method: 'POST',
    body: createRecipeSearchParams(),
  });
  for (const recipe of existingRecipes) {
    await fetch(`${RECIPES_URL}/${encodeURIComponent(recipe.id)}`, {
      method: 'DELETE',
    });
  }
  for (const recipe of recipes) {
    await requestJson(RECIPES_URL, { method: 'POST', body: recipe });
  }
}

async function requestJson<T>(
  url: string,
  { method, body }: { method: string; body: unknown },
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}
