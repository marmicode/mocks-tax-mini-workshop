import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { COURSES, type Course } from '@whiskmate/shared-recipe/model';
import { adminRecipesRouterHelper } from './admin-recipes.router-helper';

@Component({
  selector: 'wm-admin-recipe-list',
  imports: [MatButton, MatFormField, MatInput, MatLabel, RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <header>
      <h2>Recipes</h2>
      <a mat-flat-button [routerLink]="routes.create()">New recipe</a>
    </header>
    <div class="filters wm-toolbar">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Keywords</mat-label>
        <input
          #keywordsInput
          matInput
          [value]="keywords()"
          (input)="keywords.set(keywordsInput.value)"
        />
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Course</mat-label>
        <select
          #courseSelect
          matNativeControl
          (change)="course.set($any(courseSelect.value))"
        >
          <option value="">All courses</option>
          @for (option of courses; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
      </mat-form-field>
      @if (recipes.hasValue()) {
        <span class="count wm-muted"
          >{{ recipes.value().length }} recipe(s)</span
        >
      }
    </div>
    @if (recipes.hasValue()) {
      @if (recipes.value().length === 0) {
        <p class="wm-muted">No recipes found</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Course</th>
              <th class="number">Ingredients</th>
              <th class="number">Steps</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (recipe of recipes.value(); track recipe.id) {
              <tr data-testid="recipe-row">
                <td class="name">{{ recipe.name }}</td>
                <td>
                  <span class="wm-chip">{{ recipe.course }}</span>
                </td>
                <td class="number">{{ recipe.ingredients.length }}</td>
                <td class="number">{{ recipe.steps.length }}</td>
                <td>
                  <div class="row-actions">
                    <a
                      class="wm-button wm-button-outlined"
                      [routerLink]="routes.edit(recipe.id)"
                      >Edit</a
                    >
                    <a
                      class="wm-button delete"
                      [routerLink]="routes.remove(recipe.id)"
                      >Delete</a
                    >
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
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

    header {
      align-items: center;
      display: flex;
      justify-content: space-between;
    }

    .filters mat-form-field {
      width: 16rem;
    }

    .count {
      margin-left: auto;
    }

    .name {
      font: var(--mat-sys-title-small);
    }

    .number {
      text-align: right;
    }

    .row-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .row-actions a {
      font: var(--mat-sys-label-medium);
      height: 30px;
      padding: 0 0.85rem;
    }

    .row-actions .delete {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
  `,
})
export class AdminRecipeList {
  keywords = signal('');
  course = signal<Course | ''>('');

  protected readonly courses = COURSES;
  protected readonly routes = adminRecipesRouterHelper;
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  protected recipes = rxResource({
    params: () => ({ keywords: this.keywords(), course: this.course() }),
    stream: ({ params: { keywords, course } }) =>
      this._recipeRepository.search({
        keywords,
        maxIngredientCount: null,
        maxStepCount: null,
        ...(course !== '' ? { courses: [course] } : {}),
      }),
  });
}
