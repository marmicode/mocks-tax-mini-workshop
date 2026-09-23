import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { adminRecipesRouterHelper } from './admin-recipes.router-helper';
import {
  createEmptyRecipeDraft,
  toRecipe,
  toRecipeDraft,
} from './recipe-draft';
import { RecipeForm } from './recipe-form.ng';

@Component({
  selector: 'wm-admin-recipe-edit',
  imports: [RecipeForm, RouterLink],
  template: `
    <a class="back" [routerLink]="listRoute">← Recipes</a>
    @if (recipe.isLoading()) {
      <p>Loading…</p>
    } @else {
      @if (recipe.value(); as current) {
        <h2>Edit {{ current.name }}</h2>
        <wm-recipe-form
          [(draft)]="draft"
          [idEditable]="false"
          [pending]="saving()"
          submitLabel="Save"
          (save)="onSave()"
        />
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
  `,
})
export class AdminRecipeEdit {
  protected readonly listRoute = adminRecipesRouterHelper.list();

  recipeId = input.required<string>();
  saving = signal(false);

  private _recipeRepository = inject(RecipeRepository);
  private _router = inject(Router);

  protected recipe = rxResource({
    params: () => ({ id: this.recipeId() }),
    stream: ({ params }) => this._recipeRepository.findById(params),
  });

  draft = linkedSignal(() => {
    const recipe = this.recipe.hasValue() ? this.recipe.value() : undefined;
    return recipe != null ? toRecipeDraft(recipe) : createEmptyRecipeDraft();
  });

  onSave(): void {
    this.saving.set(true);
    this._recipeRepository.update(toRecipe(this.draft())).subscribe({
      next: () => this._router.navigate(adminRecipesRouterHelper.list()),
      error: () => this.saving.set(false),
    });
  }
}
