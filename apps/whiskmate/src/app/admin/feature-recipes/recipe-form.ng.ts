import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { COURSES } from '@whiskmate/shared-recipe/model';
import { type RecipeDraft, slugify } from './recipe-draft';

@Component({
  selector: 'wm-recipe-form',
  imports: [MatButton, MatFormField, MatHint, MatInput, MatLabel],
  template: `
    <form class="wm-surface" (submit)="onSubmit($event)">
      <h3>General</h3>
      <div class="row">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input
            #nameInput
            matInput
            name="name"
            required
            [value]="draft().name"
            (input)="onNameInput(nameInput.value)"
          />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Id</mat-label>
          <input
            #idInput
            matInput
            name="id"
            required
            [readonly]="!idEditable()"
            [value]="draft().id"
            (input)="onIdInput(idInput.value)"
          />
          @if (idTaken()) {
            <mat-hint class="error">This id is already taken</mat-hint>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Course</mat-label>
          <select
            #courseSelect
            matNativeControl
            name="course"
            (change)="update('course', $any(courseSelect.value))"
          >
            @for (course of courses; track course) {
              <option [value]="course" [selected]="course === draft().course">
                {{ course }}
              </option>
            }
          </select>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Description</mat-label>
        <textarea
          #descriptionInput
          matInput
          name="description"
          rows="2"
          [value]="draft().description"
          (input)="update('description', descriptionInput.value)"
        ></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Picture URI</mat-label>
        <input
          #pictureInput
          matInput
          name="pictureUri"
          [value]="draft().pictureUri"
          (input)="update('pictureUri', pictureInput.value)"
        />
      </mat-form-field>
      <h3>Recipe</h3>
      <div class="row two">
        <mat-form-field appearance="outline">
          <mat-label>Ingredients (one per line)</mat-label>
          <textarea
            #ingredientsInput
            matInput
            name="ingredients"
            rows="10"
            [value]="draft().ingredients"
            (input)="update('ingredients', ingredientsInput.value)"
          ></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Steps (one per line)</mat-label>
          <textarea
            #stepsInput
            matInput
            name="steps"
            rows="10"
            [value]="draft().steps"
            (input)="update('steps', stepsInput.value)"
          ></textarea>
        </mat-form-field>
      </div>
      <div class="actions">
        <button mat-flat-button type="submit" [disabled]="!canSave()">
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1.5rem;
    }

    h3:first-child {
      margin-top: 0;
    }

    mat-form-field {
      width: 100%;
    }

    .row {
      display: grid;
      column-gap: 1rem;
      grid-template-columns: 2fr 1.5fr 1fr;
    }

    .row.two {
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 800px) {
      .row,
      .row.two {
        grid-template-columns: 1fr;
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }

    .error {
      color: var(--mat-sys-error);
    }
  `,
})
export class RecipeForm {
  draft = model.required<RecipeDraft>();
  idEditable = input(true);
  /**
   * Derive the id from the name until the id is edited by hand.
   */
  autoSlug = input(false);
  idTaken = input(false);
  pending = input(false);
  submitLabel = input('Save');

  save = output<void>();

  protected readonly courses = COURSES;

  private _idEditedByHand = signal(false);

  canSave = computed(() => {
    const { id, name } = this.draft();
    return (
      id.trim() !== '' &&
      name.trim() !== '' &&
      !this.idTaken() &&
      !this.pending()
    );
  });

  onNameInput(name: string): void {
    this.draft.update((draft) => ({
      ...draft,
      name,
      ...(this.autoSlug() && !this._idEditedByHand()
        ? { id: slugify(name) }
        : {}),
    }));
  }

  onIdInput(id: string): void {
    this._idEditedByHand.set(true);
    this.update('id', id);
  }

  update<K extends keyof RecipeDraft>(field: K, value: RecipeDraft[K]): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.canSave()) {
      this.save.emit();
    }
  }
}
