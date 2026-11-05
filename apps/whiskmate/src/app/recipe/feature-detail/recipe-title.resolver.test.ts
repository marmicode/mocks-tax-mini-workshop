import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  type RouterStateSnapshot,
} from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
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
    const { findById } = setUpResolver();
    findById.mockReturnValue(of(shakshuka));

    const title = await resolveTitle({ recipeId: 'shakshuka' });

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(title).toBe('Shakshuka · Whiskmate');
  });

  it('falls back to a generic title when the recipe does not exist', async () => {
    const { findById } = setUpResolver();
    findById.mockReturnValue(of(undefined));

    const title = await resolveTitle({ recipeId: 'missing' });

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(title).toBe('Recipe · Whiskmate');
  });
});

function setUpResolver() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(undefined));

  return { findById };
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
