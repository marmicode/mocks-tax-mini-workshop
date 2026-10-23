import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { recipeExistsGuard } from './recipe-exists.guard';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

describe('recipeExistsGuard', () => {
  it('lets the user in when the recipe exists', async () => {
    setUpGuard();

    const result = await runGuard({ recipeId: shakshuka.id });

    expect(result).toBe(true);
  });

  it('redirects home when the recipe does not exist', async () => {
    setUpGuard();

    const result = await runGuard({ recipeId: 'missing' });

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects home when the param is missing', async () => {
    setUpGuard();

    const result = await runGuard({});

    expect(result).toBeInstanceOf(UrlTree);
  });
});

function setUpGuard() {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka]);
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
