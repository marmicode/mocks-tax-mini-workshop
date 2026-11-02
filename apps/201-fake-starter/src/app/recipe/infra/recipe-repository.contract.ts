import { it } from 'vitest';
import type { RecipeRepositoryDef } from './recipe-repository';

/**
 * Behavior every recipe repository must share,
 * whether it talks to the recipe API or keeps recipes in memory.
 *
 * The catalog is already in place: the fake seeds it,
 * and the real repository reads the recipes on the server.
 */
export function verifyRecipeRepositoryContract(
  createRecipeRepository: CreateRecipeRepository,
) {
  it.todo('returns an empty list when no keywords match', async () => {
    await createRecipeRepository();
  });

  it.todo('filters by keywords', async () => {
    await createRecipeRepository();
  });
}

type CreateRecipeRepository = () => Promise<{
  recipeRepository: RecipeRepositoryDef;
}>;
