import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import type { Quantity, Recipe } from '@whiskmate/shared-recipe/model';

export interface ShoppingItem {
  name: string;
  /**
   * Undefined when the ingredient has no quantity (e.g. "fresh coriander").
   */
  quantity?: Quantity;
  /**
   * Names of the recipes that need this ingredient.
   */
  from: string[];
}

@Injectable({ providedIn: 'root' })
export class ShoppingListBuilder {
  private _recipeRepository = inject(RecipeRepository);

  build(assignments: WeekdayAssignments): Observable<ShoppingItem[]> {
    const recipeIds = Object.values(assignments).filter(
      (recipeId): recipeId is string => recipeId != null,
    );

    if (recipeIds.length === 0) {
      return of([]);
    }

    return forkJoin(
      recipeIds.map((id) => this._recipeRepository.findById({ id })),
    ).pipe(
      map((recipes) =>
        mergeIngredients(
          recipes.filter((recipe): recipe is Recipe => recipe != null),
        ),
      ),
    );
  }
}

function mergeIngredients(recipes: Recipe[]): ShoppingItem[] {
  const items = new Map<string, ShoppingItem>();

  for (const recipe of recipes) {
    for (const { name, quantity } of recipe.ingredients) {
      const key = `${name.toLowerCase()}|${quantity?.unit ?? ''}`;
      const item = items.get(key);

      if (item == null) {
        items.set(key, {
          name,
          ...(quantity ? { quantity: { ...quantity } } : {}),
          from: [recipe.name],
        });
        continue;
      }

      if (item.quantity != null && quantity != null) {
        item.quantity = {
          ...item.quantity,
          amount: item.quantity.amount + quantity.amount,
        };
      }
      if (!item.from.includes(recipe.name)) {
        item.from = [...item.from, recipe.name];
      }
    }
  }

  return [...items.values()].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );
}
