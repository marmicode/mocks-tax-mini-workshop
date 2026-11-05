import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { adminRecipesRouterHelper } from './admin-recipes.router-helper';
import { createEmptyRecipeDraft, toRecipe } from './recipe-draft';
import { RecipeForm } from './recipe-form.ng';
import { RecipeIdAvailability } from './recipe-id-availability';

@Component({
  selector: 'wm-admin-recipe-create',
  imports: [RecipeForm, RouterLink],
  template: `
    <a class="back" [routerLink]="listRoute">← Recipes</a>
    <h2>New recipe</h2>
    <wm-recipe-form
      [(draft)]="draft"
      [autoSlug]="true"
      [idTaken]="idTaken()"
      [pending]="saving() || idAvailability.isLoading()"
      submitLabel="Create"
      (save)="onSave()"
    />
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
export class AdminRecipeCreate {
  protected readonly listRoute = adminRecipesRouterHelper.list();

  draft = signal(createEmptyRecipeDraft());
  saving = signal(false);

  private _recipeRepository = inject(RecipeRepository);
  private _recipeIdAvailability = inject(RecipeIdAvailability);
  private _router = inject(Router);

  private _draftId = computed(() => this.draft().id.trim());

  protected idAvailability = rxResource({
    params: () => this._draftId(),
    stream: ({ params }) => this._recipeIdAvailability.isAvailable(params),
  });

  idTaken = computed(
    () => this.idAvailability.hasValue() && !this.idAvailability.value(),
  );

  onSave(): void {
    this.saving.set(true);
    this._recipeRepository.create(toRecipe(this.draft())).subscribe({
      next: () => this._router.navigate(adminRecipesRouterHelper.list()),
      error: () => this.saving.set(false),
    });
  }
}
