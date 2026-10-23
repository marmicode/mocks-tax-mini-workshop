import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  type RouterStateSnapshot,
} from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeTitleResolver } from './recipe-title.resolver';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe('recipeTitleResolver', () => {
  it('uses the recipe name as title', async () => {
    setUpResolver();

    const title = await resolveTitle({ recipeId: 'shakshuka' });

    expect(title).toBe('Shakshuka · Whiskmate');
  });

  it('falls back to a generic title when the recipe does not exist', async () => {
    setUpResolver();

    const title = await resolveTitle({ recipeId: 'missing' });

    expect(title).toBe('Recipe · Whiskmate');
  });
});

function setUpResolver() {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka]);
}

async function resolveTitle(params: Record<string, string>) {
  const route = {
    paramMap: convertToParamMap(params),
  } as ActivatedRouteSnapshot;
  const result = TestBed.runInInjectionContext(() =>
    recipeTitleResolver(route, {} as RouterStateSnapshot),
  );
  return isObservable(result) ? firstValueFrom(result) : result;
}
