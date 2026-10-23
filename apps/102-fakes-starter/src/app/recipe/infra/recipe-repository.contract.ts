import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import {
  createRecipeSearchParams,
  type RecipeRepositoryDef,
  type RecipeSearchParams,
} from './recipe-repository';

/**
 * Behavior every recipe repository must share,
 * whether it talks to the recipe API or keeps recipes in memory.
 */
export function verifyRecipeRepositoryContract(
  createRecipeRepository: CreateRecipeRepository,
) {
  describe('search', () => {
    it('finds no recipe when the catalog is empty', async () => {
      const { recipeRepository } = await setUpRecipeRepository([]);

      expect(await search(recipeRepository)).toEqual([]);
    });

    it('finds every recipe without filters', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
        cheesecake,
      ]);

      expect(await search(recipeRepository)).toEqual([
        hummus,
        shakshuka,
        cheesecake,
      ]);
    });

    it('finds recipes whose name contains the keywords ignoring case', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
        cheesecake,
      ]);

      expect(await search(recipeRepository, { keywords: 'SHAK' })).toEqual([
        shakshuka,
      ]);
    });

    it('finds recipes with at most the given ingredient count', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
        cheesecake,
      ]);

      expect(await search(recipeRepository, { maxIngredientCount: 5 })).toEqual(
        [hummus, shakshuka],
      );
    });

    it('finds recipes with at most the given step count', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
        cheesecake,
      ]);

      expect(await search(recipeRepository, { maxStepCount: 5 })).toEqual([
        hummus,
        cheesecake,
      ]);
    });

    it('finds recipes of the given courses', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
        cheesecake,
      ]);

      expect(
        await search(recipeRepository, { courses: ['starter', 'dessert'] }),
      ).toEqual([hummus, cheesecake]);
    });

    it('finds no recipe when no course is given', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
        cheesecake,
      ]);

      expect(await search(recipeRepository, { courses: [] })).toEqual([]);
    });

    it('combines filters', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
        cheesecake,
      ]);

      expect(
        await search(recipeRepository, { keywords: 'a', maxStepCount: 5 }),
      ).toEqual([cheesecake]);
    });
  });

  describe('findById', () => {
    it('finds a recipe by id', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
      ]);

      expect(
        await firstValueFrom(recipeRepository.findById({ id: shakshuka.id })),
      ).toEqual(shakshuka);
    });

    it('returns undefined when the recipe does not exist', async () => {
      const { recipeRepository } = await setUpRecipeRepository([hummus]);

      expect(
        await firstValueFrom(recipeRepository.findById({ id: 'missing' })),
      ).toBeUndefined();
    });
  });

  async function setUpRecipeRepository(recipes: Recipe[]) {
    const { recipeRepository } = await createRecipeRepository();
    for (const recipe of recipes) {
      await firstValueFrom(recipeRepository.create(recipe));
    }
    return { recipeRepository };
  }
}

type CreateRecipeRepository = () =>
  | Promise<{ recipeRepository: RecipeRepositoryDef }>
  | { recipeRepository: RecipeRepositoryDef };

function search(
  recipeRepository: RecipeRepositoryDef,
  params: Partial<RecipeSearchParams> = {},
): Promise<Recipe[]> {
  return firstValueFrom(
    recipeRepository.search(createRecipeSearchParams(params)),
  );
}

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withManySteps()
  .build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .withManyIngredients()
  .build();
