import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { RecipeRepository } from '@whiskmate/recipe/infra';

/**
 * Sends the user back home when the recipe in the `recipeId` param does not exist.
 */
export const recipeExistsGuard: CanActivateFn = (route) => {
  const recipeRepository = inject(RecipeRepository);
  const router = inject(Router);
  const id = route.paramMap.get('recipeId') ?? '';

  return recipeRepository
    .findById({ id })
    .pipe(
      map((recipe) => (recipe != null ? true : router.createUrlTree(['/']))),
    );
};
