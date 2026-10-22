import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, it, vi } from 'vitest';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from './recipe-repository';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeRepository.name, () => {
  it('searches all recipes without query params', async () => {
    const { repository, get } = setUpRecipeRepository();
    get.mockReturnValue(of([shakshuka]));

    const recipes = await firstValueFrom(
      repository.search({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
      }),
    );

    expect(get).toHaveBeenCalledExactlyOnceWith('/api/recipes', {
      params: {},
    });
    expect(recipes).toEqual([shakshuka]);
  });

  it('sends keywords, max ingredients and max steps', async () => {
    const { repository, get } = setUpRecipeRepository();

    await firstValueFrom(
      repository.search({
        keywords: 'shak',
        maxIngredientCount: 5,
        maxStepCount: 3,
      }),
    );

    expect(get).toHaveBeenCalledExactlyOnceWith('/api/recipes', {
      params: { keywords: 'shak', maxIngredientCount: 5, maxStepCount: 3 },
    });
  });

  it('sends courses', async () => {
    const { repository, get } = setUpRecipeRepository();

    await firstValueFrom(
      repository.search({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: ['starter', 'dessert'],
      }),
    );

    expect(get).toHaveBeenCalledExactlyOnceWith('/api/recipes', {
      params: { courses: ['starter', 'dessert'] },
    });
  });

  it('fetches a recipe by id', async () => {
    const { repository, get } = setUpRecipeRepository();
    get.mockReturnValue(of(shakshuka));

    const recipe = await firstValueFrom(
      repository.findById({ id: 'shakshuka' }),
    );

    expect(get).toHaveBeenCalledExactlyOnceWith('/api/recipes/shakshuka');
    expect(recipe).toEqual(shakshuka);
  });

  it('returns undefined when the recipe is not found', async () => {
    const { repository, get } = setUpRecipeRepository();
    get.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    const recipe = await firstValueFrom(repository.findById({ id: 'missing' }));

    expect(get).toHaveBeenCalledExactlyOnceWith('/api/recipes/missing');
    expect(recipe).toBeUndefined();
  });

  it('creates a recipe', async () => {
    const repository = TestBed.inject(RecipeRepository);
    const post = vi
      .spyOn(TestBed.inject(HttpClient), 'post')
      .mockReturnValue(of(shakshuka));

    const recipe = await firstValueFrom(repository.create(shakshuka));

    expect(post).toHaveBeenCalledExactlyOnceWith('/api/recipes', shakshuka);
    expect(recipe).toEqual(shakshuka);
  });

  it('updates a recipe', async () => {
    const repository = TestBed.inject(RecipeRepository);
    const put = vi
      .spyOn(TestBed.inject(HttpClient), 'put')
      .mockReturnValue(of(shakshuka));

    await firstValueFrom(repository.update(shakshuka));

    expect(put).toHaveBeenCalledExactlyOnceWith(
      '/api/recipes/shakshuka',
      shakshuka,
    );
  });

  it('removes a recipe', async () => {
    const repository = TestBed.inject(RecipeRepository);
    const httpDelete = vi
      .spyOn(TestBed.inject(HttpClient), 'delete')
      .mockReturnValue(of(undefined));

    await firstValueFrom(repository.remove({ id: 'shakshuka' }));

    expect(httpDelete).toHaveBeenCalledExactlyOnceWith(
      '/api/recipes/shakshuka',
    );
  });
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

function setUpRecipeRepository() {
  const get = vi
    .spyOn(TestBed.inject(HttpClient), 'get')
    .mockReturnValue(of([]));
  const repository = TestBed.inject(RecipeRepository);
  return { repository, get };
}
