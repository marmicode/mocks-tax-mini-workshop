import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { type Course, COURSES } from '@whiskmate/shared-recipe/model';

@Component({
  imports: [RouterLink],
  selector: 'wm-admin-export',
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Export recipes</h2>
    <p class="intro wm-muted">Download the catalog as a JSON file.</p>
    <div class="wm-toolbar">
      <label class="course">
        Course
        <select
          aria-label="Course"
          (change)="onCourseChange($any($event.target).value)"
        >
          <option value="">All courses</option>
          @for (course of courses; track course) {
            <option [value]="course">{{ course }}</option>
          }
        </select>
      </label>
      @if (recipes.hasValue()) {
        <span class="wm-chip" data-testid="export-count">
          {{ recipes.value().length }} recipe(s) to export
        </span>
        <button
          type="button"
          class="wm-button-primary download"
          (click)="download()"
        >
          Download recipes.json
        </button>
      }
    </div>
    @if (recipes.hasValue()) {
      <pre data-testid="export-preview">{{ json() }}</pre>
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

    .course {
      align-items: center;
      display: inline-flex;
      gap: 0.5rem;
    }

    .download {
      margin-left: auto;
    }

    pre {
      box-shadow: inset 0 0 0 1px var(--mat-sys-outline-variant);
      font-size: 0.8rem;
      max-height: 60vh;
    }
  `,
})
export class AdminExport {
  protected readonly adminRoute = ['/', 'admin'];

  readonly courses = COURSES;

  course = signal<Course | null>(null);

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    params: () => this.course(),
    stream: ({ params: course }) =>
      this._recipeRepository.search(
        createRecipeSearchParams(course != null ? { courses: [course] } : {}),
      ),
  });

  json = computed(() =>
    this.recipes.hasValue()
      ? JSON.stringify(this.recipes.value(), null, 2)
      : '',
  );

  onCourseChange(value: string): void {
    this.course.set(COURSES.find((course) => course === value) ?? null);
  }

  download(): void {
    const blob = new Blob([this.json()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recipes.json';
    link.click();
    URL.revokeObjectURL(url);
  }
}
