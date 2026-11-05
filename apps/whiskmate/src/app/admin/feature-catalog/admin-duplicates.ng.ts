import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

const STOPWORDS = new Set(['and', 'with']);
const INGREDIENT_OVERLAP_THRESHOLD = 0.8;

export interface DuplicatePair {
  left: Recipe;
  right: Recipe;
  reason: 'name' | 'ingredients';
}

@Component({
  selector: 'wm-admin-duplicates',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Duplicate recipes</h2>
    <p class="intro wm-muted">
      Recipes with the same name or sharing most of their ingredients.
    </p>
    @if (recipes.hasValue()) {
      @if (pairs().length === 0) {
        <p class="empty wm-surface" data-testid="no-duplicates">
          No duplicates found
        </p>
      } @else {
        <ul class="pairs">
          @for (pair of pairs(); track pair.left.id + pair.right.id) {
            <li class="pair wm-surface" data-testid="duplicate-pair">
              <a [routerLink]="editRoute(pair.left.id)">{{ pair.left.name }}</a>
              ↔
              <a [routerLink]="editRoute(pair.right.id)">{{
                pair.right.name
              }}</a>
              <span class="reason wm-chip">
                (same {{ pair.reason === 'name' ? 'name' : 'ingredients' }})
              </span>
            </li>
          }
        </ul>
      }
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

    .pairs {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .pair {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .pair a {
      font: var(--mat-sys-title-small);
    }

    .reason {
      margin-left: auto;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
    }
  `,
})
export class AdminDuplicates {
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  pairs = computed(() =>
    this.recipes.hasValue() ? findDuplicates(this.recipes.value()) : [],
  );

  editRoute(recipeId: string) {
    return adminRecipesRouterHelper.edit(recipeId);
  }
}

function findDuplicates(recipes: Recipe[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  recipes.forEach((left, index) => {
    for (const right of recipes.slice(index + 1)) {
      if (normalizeName(left.name) === normalizeName(right.name)) {
        pairs.push({ left, right, reason: 'name' });
      } else if (
        ingredientOverlap(left, right) >= INGREDIENT_OVERLAP_THRESHOLD
      ) {
        pairs.push({ left, right, reason: 'ingredients' });
      }
    }
  });
  return pairs;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOPWORDS.has(word))
    .sort()
    .join(' ');
}

function ingredientOverlap(left: Recipe, right: Recipe): number {
  const leftNames = new Set(
    left.ingredients.map(({ name }) => normalizeName(name)),
  );
  const rightNames = new Set(
    right.ingredients.map(({ name }) => normalizeName(name)),
  );
  const largest = Math.max(leftNames.size, rightNames.size);
  if (largest === 0) {
    return 0;
  }
  const shared = [...leftNames].filter((name) => rightNames.has(name)).length;
  return shared / largest;
}
