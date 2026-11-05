import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { RecipeRepository } from '@whiskmate/recipe/infra';

export const recipeTitleResolver: ResolveFn<string> = (route) => {
  const id = route.paramMap.get('recipeId') ?? '';

  return inject(RecipeRepository)
    .findById({ id })
    .pipe(
      map((recipe) =>
        recipe != null ? `${recipe.name} · Whiskmate` : 'Recipe · Whiskmate',
      ),
    );
};
