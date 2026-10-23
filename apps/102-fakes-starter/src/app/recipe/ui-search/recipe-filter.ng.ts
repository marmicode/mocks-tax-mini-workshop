import { Component, model } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  createDefaultRecipeFilterCriteria,
  type RecipeFilterCriteria,
} from '@whiskmate/recipe/model';
import { COURSES, type Course } from '@whiskmate/shared-recipe/model';

@Component({
  selector: 'wm-recipe-filter',
  imports: [
    FormField,
    FormRoot,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
  ],
  template: `
    <form class="filter-form" [formRoot]="filterForm">
      <div class="filter-fields">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Keywords</mat-label>
          <input [formField]="filterForm.keywords" matInput type="text" />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Max Ingredients</mat-label>
          <input
            [formField]="filterForm.maxIngredientCount"
            matInput
            type="number"
          />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Max Steps</mat-label>
          <input [formField]="filterForm.maxStepCount" matInput type="number" />
        </mat-form-field>
      </div>
      <div class="filter-options">
        <mat-button-toggle-group
          [value]="filter().courses ?? []"
          (change)="setCourses($event.value)"
          aria-label="Courses"
          multiple
        >
          @for (course of courses; track course) {
            <mat-button-toggle [value]="course">{{ course }}</mat-button-toggle>
          }
        </mat-button-toggle-group>
        <mat-checkbox [formField]="filterForm.favoritesOnly">
          Favorites only
        </mat-checkbox>
      </div>
    </form>
  `,
  styles: `
    .filter-form {
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 2px 8px rgb(0 0 0 / 6%);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem;
    }

    mat-button-toggle {
      text-transform: capitalize;
    }

    .filter-fields {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .filter-options {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem 1.5rem;
    }
  `,
})
export class RecipeFilter {
  filter = model<RecipeFilterCriteria>(createDefaultRecipeFilterCriteria());

  filterForm = form(this.filter);

  protected readonly courses = COURSES;

  protected setCourses(courses: Course[]) {
    this.filter.update((filter) => ({
      ...filter,
      courses: courses.length > 0 ? courses : null,
    }));
  }
}
