import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

interface IngredientUsage {
  name: string;
  count: number;
}

@Component({
  imports: [RouterLink],
  selector: 'wm-admin-ingredients',
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Ingredients</h2>
    <p class="intro wm-muted">
      Renaming an ingredient updates every recipe that uses it.
    </p>
    @if (recipes.hasValue()) {
      <table>
        <thead>
          <tr>
            <th>Ingredient</th>
            <th class="number">Recipes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (usage of usages(); track usage.name) {
            <tr data-testid="ingredient-row">
              <td data-testid="ingredient-name">{{ usage.name }}</td>
              <td class="number" data-testid="ingredient-count">
                {{ usage.count }}
              </td>
              <td>
                <div class="actions">
                  @if (renaming() === usage.name) {
                    <input
                      #newName
                      [attr.aria-label]="'New name for ' + usage.name"
                      [value]="usage.name"
                    />
                    <button
                      type="button"
                      class="wm-button-primary"
                      (click)="onRename(usage.name, newName.value)"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      class="wm-button-outlined"
                      (click)="renaming.set(null)"
                    >
                      Cancel
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="wm-button-outlined"
                      (click)="renaming.set(usage.name)"
                    >
                      Rename
                    </button>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .back {
      font: var(--mat-sys-label-large);
    }

    .intro {
      margin: -0.75rem 0 1.5rem;
    }

    .number {
      text-align: right;
      width: 6rem;
    }

    .actions {
      align-items: center;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .actions button {
      height: 32px;
    }

    .actions input {
      min-height: 32px;
      padding: 0.2rem 0.6rem;
    }
  `,
})
export class AdminIngredients {
  protected readonly adminRoute = ['/', 'admin'];

  renaming = signal<string | null>(null);

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  usages = computed<IngredientUsage[]>(() => {
    if (!this.recipes.hasValue()) {
      return [];
    }
    const counts = new Map<string, number>();
    for (const recipe of this.recipes.value()) {
      const names = new Set(
        recipe.ingredients.map(({ name }) => normalize(name)),
      );
      for (const name of names) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  });

  onRename(oldName: string, newName: string): void {
    const trimmedName = newName.trim();
    if (
      !this.recipes.hasValue() ||
      trimmedName === '' ||
      trimmedName === oldName
    ) {
      this.renaming.set(null);
      return;
    }

    const updates = this.recipes
      .value()
      .filter((recipe) => usesIngredient(recipe, oldName))
      .map((recipe) =>
        this._recipeRepository.update({
          ...recipe,
          ingredients: recipe.ingredients.map((ingredient) =>
            normalize(ingredient.name) === oldName
              ? { ...ingredient, name: trimmedName }
              : ingredient,
          ),
        }),
      );

    forkJoin(updates).subscribe(() => {
      this.renaming.set(null);
      this.recipes.reload();
    });
  }
}

function usesIngredient(recipe: Recipe, name: string): boolean {
  return recipe.ingredients.some(
    (ingredient) => normalize(ingredient.name) === name,
  );
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}
