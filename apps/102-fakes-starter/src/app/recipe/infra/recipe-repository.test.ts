import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, it } from 'vitest';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from './recipe-repository';
import { verifyRecipeRepositoryContract } from './recipe-repository.contract';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

describe(RecipeRepository.name, () => {
  /* Runs against the real recipe API, served by the Vite plugin in `vitest.config.mts`. */
  verifyRecipeRepositoryContract(createRecipeRepository);

  describe('HTTP protocol', () => {
    afterEach(() => {
      TestBed.inject(HttpTestingController).verify();
    });

    it('searches all recipes', async () => {
      const { repository, httpTesting } =
        setUpRecipeRepositoryWithHttpTesting();

      const recipes = firstValueFrom(
        repository.search({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: null,
        }),
      );

      const req = httpTesting.expectOne({
        method: 'POST',
        url: '/api/recipes/search',
      });
      expect(req.request.body).toEqual({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
      });
      req.flush([shakshuka]);

      expect(await recipes).toEqual([shakshuka]);
    });

    it('sends keywords, max ingredients and max steps', async () => {
      const { repository, httpTesting } =
        setUpRecipeRepositoryWithHttpTesting();

      const recipes = firstValueFrom(
        repository.search({
          keywords: 'shak',
          maxIngredientCount: 5,
          maxStepCount: 3,
        }),
      );

      const req = httpTesting.expectOne({
        method: 'POST',
        url: '/api/recipes/search',
      });
      expect(req.request.body).toEqual({
        keywords: 'shak',
        maxIngredientCount: 5,
        maxStepCount: 3,
      });
      req.flush([]);

      await recipes;
    });

    it('sends courses', async () => {
      const { repository, httpTesting } =
        setUpRecipeRepositoryWithHttpTesting();

      const recipes = firstValueFrom(
        repository.search({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: null,
          courses: ['starter', 'dessert'],
        }),
      );

      const req = httpTesting.expectOne({
        method: 'POST',
        url: '/api/recipes/search',
      });
      expect(req.request.body).toEqual({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: ['starter', 'dessert'],
      });
      req.flush([]);

      await recipes;
    });

    it('fetches a recipe by id', async () => {
      const { repository, httpTesting } =
        setUpRecipeRepositoryWithHttpTesting();

      const recipe = firstValueFrom(repository.findById({ id: shakshuka.id }));

      httpTesting
        .expectOne({ method: 'GET', url: `/api/recipes/${shakshuka.id}` })
        .flush(shakshuka);

      expect(await recipe).toEqual(shakshuka);
    });

    it('returns undefined when the recipe is not found', async () => {
      const { repository, httpTesting } =
        setUpRecipeRepositoryWithHttpTesting();

      const recipe = firstValueFrom(repository.findById({ id: 'missing' }));

      httpTesting
        .expectOne({ method: 'GET', url: '/api/recipes/missing' })
        .flush(null, { status: 404, statusText: 'Not Found' });

      expect(await recipe).toBeUndefined();
    });

    it('creates a recipe', async () => {
      const { repository, httpTesting } =
        setUpRecipeRepositoryWithHttpTesting();

      const recipe = firstValueFrom(repository.create(shakshuka));

      const req = httpTesting.expectOne({
        method: 'POST',
        url: '/api/recipes',
      });
      expect(req.request.body).toEqual(shakshuka);
      req.flush(shakshuka);

      expect(await recipe).toEqual(shakshuka);
    });

    it('updates a recipe', async () => {
      const { repository, httpTesting } =
        setUpRecipeRepositoryWithHttpTesting();

      const recipe = firstValueFrom(repository.update(shakshuka));

      const req = httpTesting.expectOne({
        method: 'PUT',
        url: `/api/recipes/${shakshuka.id}`,
      });
      expect(req.request.body).toEqual(shakshuka);
      req.flush(shakshuka);

      await recipe;
    });

    it('removes a recipe', async () => {
      const { repository, httpTesting } =
        setUpRecipeRepositoryWithHttpTesting();

      const result = firstValueFrom(repository.remove({ id: shakshuka.id }));

      httpTesting
        .expectOne({ method: 'DELETE', url: `/api/recipes/${shakshuka.id}` })
        .flush(null, { status: 204, statusText: 'No Content' });

      await result;
    });
  });

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

describe(createRecipeSearchParams.name, () => {
  it('creates search params with defaults', () => {
    expect(createRecipeSearchParams()).toEqual({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('overrides defaults', () => {
    expect(createRecipeSearchParams({ maxStepCount: 3 })).toEqual({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 3,
    });
  });
});

function setUpRecipeRepositoryWithHttpTesting() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const repository = TestBed.inject(RecipeRepository);
  const httpTesting = TestBed.inject(HttpTestingController);
  return { repository, httpTesting };
}
