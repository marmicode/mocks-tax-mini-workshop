import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { createRecipe, type Recipe } from '@whiskmate/shared-recipe/model';
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

      expect(await search(recipeRepository, { maxIngredientCount: 2 })).toEqual(
        [hummus],
      );
    });

    it('finds recipes with at most the given step count', async () => {
      const { recipeRepository } = await setUpRecipeRepository([
        hummus,
        shakshuka,
        cheesecake,
      ]);

      expect(await search(recipeRepository, { maxStepCount: 2 })).toEqual([
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
        await search(recipeRepository, { keywords: 'a', maxStepCount: 2 }),
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
        await firstValueFrom(recipeRepository.findById({ id: 'shakshuka' })),
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
        await firstValueFrom(recipeRepository.findById({ id: 'shakshuka' })),
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
      const updatedHummus = createRecipe({ ...hummus, name: 'Hummus' });

      const updated = await firstValueFrom(
        recipeRepository.update(updatedHummus),
      );

      expect(updated).toEqual(updatedHummus);
      expect(
        await firstValueFrom(recipeRepository.findById({ id: 'hummus-ful' })),
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

      await firstValueFrom(recipeRepository.remove({ id: 'hummus-ful' }));

      expect(
        await firstValueFrom(recipeRepository.findById({ id: 'hummus-ful' })),
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

const hummus = createRecipe({
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: 'Creamy hummus topped with warm ful.',
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
  steps: ['Blend the chickpeas with the tahini.'],
});

const shakshuka = createRecipe({
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }, { name: 'peppers' }],
  steps: ['Cook the sauce.', 'Poach the eggs.', 'Serve.'],
});

const cheesecake = createRecipe({
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [
    { name: 'ricotta' },
    { name: 'eggs' },
    { name: 'sugar' },
    { name: 'lemons' },
    { name: 'flour' },
  ],
  steps: ['Mix everything.', 'Bake.'],
});
