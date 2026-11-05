import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { adminRecipesRouterHelper } from './admin-recipes.router-helper';

@Component({
  selector: 'wm-admin-recipe-delete',
  imports: [MatIcon, RouterLink],
  template: `
    <a class="back" [routerLink]="listRoute">← Recipes</a>
    @if (recipe.isLoading()) {
      <p class="wm-muted">Loading…</p>
    } @else {
      @if (recipe.value(); as current) {
        <section class="confirm wm-surface">
          <mat-icon class="icon">warning</mat-icon>
          <div>
            <h2>Delete {{ current.name }}?</h2>
            <p>
              This removes the recipe from the catalog. Meal plans that use it
              will show an empty day.
            </p>
            <div class="actions">
              <button
                class="wm-button-danger"
                type="button"
                [disabled]="deleting()"
                (click)="onDelete(current.id)"
              >
                Delete
              </button>
              <a class="wm-button wm-button-outlined" [routerLink]="listRoute"
                >Cancel</a
              >
            </div>
          </div>
        </section>
      } @else {
        <h2>Recipe not found</h2>
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

    .confirm {
      border-left: 4px solid var(--mat-sys-error);
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      max-width: 40rem;
      padding: 1.5rem;
    }

    .icon {
      color: var(--mat-sys-error);
      flex-shrink: 0;
    }

    h2 {
      margin-top: 0;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
  `,
})
export class AdminRecipeDelete {
  recipeId = input.required<string>();
  deleting = signal(false);

  protected readonly listRoute = adminRecipesRouterHelper.list();

  private _recipeRepository = inject(RecipeRepository);
  private _router = inject(Router);

  protected recipe = rxResource({
    params: () => ({ id: this.recipeId() }),
    stream: ({ params }) => this._recipeRepository.findById(params),
  });

  onDelete(id: string): void {
    this.deleting.set(true);
    this._recipeRepository.remove({ id }).subscribe({
      next: () => this._router.navigate(this.listRoute),
      error: () => this.deleting.set(false),
    });
  }
}
