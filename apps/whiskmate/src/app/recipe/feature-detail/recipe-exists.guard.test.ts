import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeExistsGuard } from './recipe-exists.guard';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe('recipeExistsGuard', () => {
  it('lets the user in when the recipe exists', async () => {
    const { findById } = setUpGuard();
    findById.mockReturnValue(of(shakshuka));

    const result = await runGuard({ recipeId: 'shakshuka' });

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(result).toBe(true);
  });

  it('redirects home when the recipe does not exist', async () => {
    const { findById } = setUpGuard();
    findById.mockReturnValue(of(undefined));

    const result = await runGuard({ recipeId: 'missing' });

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('looks up an empty id when the param is missing', async () => {
    const { findById } = setUpGuard();
    findById.mockReturnValue(of(undefined));

    const result = await runGuard({});

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: '' });
    expect(result).toBeInstanceOf(UrlTree);
  });
});

function setUpGuard() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(undefined));

  return { findById };
}

async function runGuard(params: Record<string, string>) {
  const route = {
    paramMap: convertToParamMap(params),
  } as ActivatedRouteSnapshot;
  const result = TestBed.runInInjectionContext(() =>
    recipeExistsGuard(route, {} as RouterStateSnapshot),
  );
  return isObservable(result) ? firstValueFrom(result) : result;
}
