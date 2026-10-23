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

  describe('create', () => {
    it('adds the recipe to the catalog', async () => {
      const { recipeRepository } = await setUpRecipeRepository([hummus]);

      const created = await firstValueFrom(recipeRepository.create(shakshuka));

      expect(created).toEqual(shakshuka);
      expect(
        await firstValueFrom(recipeRepository.findById({ id: shakshuka.id })),
      ).toEqual(shakshuka);
      expect(await search(recipeRepository)).toEqual([hummus, shakshuka]);
    });

    it('rejects an id that is already taken', async () => {
      const { recipeRepository } = await setUpRecipeRepository([hummus]);

      await expect(
        firstValueFrom(recipeRepository.create({ ...hummus, name: 'Hummus' })),
      ).rejects.toThrow();
      expect(await search(recipeRepository)).toEqual([hummus]);
    });
  });

  describe('update', () => {
    it('replaces the recipe', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
      ]);
      const updatedHummus = recipeMother
        .withBasicInfo({ name: 'Hummus', course: 'starter' })
        .withId(hummus.id)
        .build();

      const updated = await firstValueFrom(
        recipeRepository.update(updatedHummus),
      );

      expect(updated).toEqual(updatedHummus);
      expect(
        await firstValueFrom(recipeRepository.findById({ id: hummus.id })),
      ).toEqual(updatedHummus);
      expect(await search(recipeRepository)).toEqual([
        updatedHummus,
        shakshuka,
      ]);
    });

    it('rejects a recipe that does not exist', async () => {
      const { recipeRepository } = await setUpRecipeRepository([hummus]);

      await expect(
        firstValueFrom(recipeRepository.update(shakshuka)),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('removes the recipe from the catalog', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
      ]);

      await firstValueFrom(recipeRepository.remove({ id: hummus.id }));

      expect(
        await firstValueFrom(recipeRepository.findById({ id: hummus.id })),
      ).toBeUndefined();
      expect(await search(recipeRepository)).toEqual([shakshuka]);
    });

    it('rejects a recipe that does not exist', async () => {
      const { recipeRepository } = await setUpRecipeRepository([hummus]);

      await expect(
        firstValueFrom(recipeRepository.remove({ id: 'missing' })),
      ).rejects.toThrow();
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
