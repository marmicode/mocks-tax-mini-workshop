import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

const PROJECT_COUNT = 5;

@Component({
  selector: 'wm-weekend-projects',
  imports: [RouterLink],
  template: `
    <h2>Weekend projects</h2>
    <p class="wm-muted">The ${PROJECT_COUNT} most involved recipes.</p>
    @if (projects.hasValue()) {
      <ol>
        @for (recipe of projects.value(); track recipe.id) {
          <li data-testid="weekend-project">
            <a
              data-testid="recipe-name"
              [routerLink]="detailRoute(recipe.id)"
              >{{ recipe.name }}</a
            >
            <span data-testid="step-count"
              >{{ recipe.steps.length }} steps</span
            >
          </li>
        } @empty {
          <p class="empty" data-testid="no-recipes-message">
            No weekend projects found.
          </p>
        }
      </ol>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    li {
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    span {
      color: var(--mat-sys-on-surface-variant);
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class WeekendProjects {
  private _recipeRepository = inject(RecipeRepository);

  projects = rxResource({
    stream: () =>
      this._recipeRepository
        .search(createRecipeSearchParams())
        .pipe(map(mostInvolved)),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}

function mostInvolved(recipes: Recipe[]): Recipe[] {
  return [...recipes]
    .sort((a, b) => b.steps.length - a.steps.length)
    .slice(0, PROJECT_COUNT);
}
