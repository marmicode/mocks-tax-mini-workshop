import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { RouterLink } from '@angular/router';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { recipeDetailRouterHelper } from './recipe-detail.router-helper';

@Component({
  selector: 'wm-recipe-cooking-mode',
  imports: [MatCheckbox, RouterLink],
  template: `
    @if (recipe.status() === 'resolved') {
      @if (recipe.value(); as recipe) {
        <div class="wm-toolbar heading">
          <h2>Cooking {{ recipe.name }}</h2>
          <a class="wm-button wm-button-outlined" [routerLink]="detailLink()"
            >Back to recipe</a
          >
        </div>
        <div class="layout">
          <section class="wm-surface ingredients">
            <h3>Ingredients</h3>
            @for (ingredient of recipe.ingredients; track $index) {
              <mat-checkbox>{{ ingredient.name }}</mat-checkbox>
            }
          </section>
          <section class="wm-surface step-card">
            <div
              class="progress"
              [style.--progress]="(stepIndex() + 1) / recipe.steps.length"
            ></div>
            <h3 data-testid="step-counter">
              Step {{ stepIndex() + 1 }} of {{ recipe.steps.length }}
            </h3>
            <p class="step" data-testid="current-step">
              {{ recipe.steps[stepIndex()] }}
            </p>
            <div class="navigation">
              <button
                type="button"
                class="previous wm-button-outlined"
                [disabled]="isFirstStep()"
                (click)="onPrevious()"
              >
                Previous
              </button>
              <button
                type="button"
                class="next wm-button-primary"
                [disabled]="isLastStep()"
                (click)="onNext()"
              >
                Next
              </button>
            </div>
            @if (isLastStep()) {
              <p data-testid="done-message">Enjoy your meal! 🍽️</p>
            }
          </section>
        </div>
      } @else {
        <p data-testid="recipe-not-found">This recipe does not exist.</p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .heading {
      justify-content: space-between;

      h2 {
        margin: 0;
      }
    }

    .layout {
      align-items: start;
      display: grid;
      gap: 1.5rem;
      grid-template-columns: minmax(220px, 1fr) minmax(0, 2.5fr);
    }

    @media (max-width: 800px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }

    .ingredients {
      display: flex;
      flex-direction: column;

      h3 {
        margin-top: 0.25rem;
      }
    }

    .step-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 320px;
      overflow: hidden;
      padding: 0 2rem 2rem;
      position: relative;
    }

    .progress {
      background: var(--mat-sys-surface-container-high);
      height: 6px;
      margin: 0 -2rem 1rem;
      position: relative;

      &::after {
        background: var(--mat-sys-primary);
        content: '';
        inset: 0;
        position: absolute;
        transform: scaleX(var(--progress));
        transform-origin: left;
        transition: transform 200ms;
      }
    }

    [data-testid='step-counter'] {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-title-medium);
      letter-spacing: 0.05em;
      margin: 0;
      text-transform: uppercase;
    }

    .step {
      flex: 1;
      font: var(--mat-sys-headline-medium);
      line-height: 1.4;
      margin: 0;
    }

    .navigation {
      display: flex;
      gap: 1rem;
      justify-content: space-between;
    }

    .navigation button {
      font-size: 1rem;
      height: 48px;
      padding: 0 1.75rem;
    }

    .previous::before,
    .next::after {
      font-family: 'Material Icons';
      font-size: 20px;
    }

    .previous::before {
      content: 'arrow_back';
    }

    .next::after {
      content: 'arrow_forward';
    }

    [data-testid='done-message'] {
      font: var(--mat-sys-title-large);
      margin: 0;
      text-align: center;
    }
  `,
})
export class RecipeCookingMode {
  recipeId = input.required<string>();

  stepIndex = signal(0);

  private _recipeRepository = inject(RecipeRepository);

  recipe = rxResource({
    params: () => ({ id: this.recipeId() }),
    stream: ({ params }) => this._recipeRepository.findById(params),
  });

  private _stepCount = computed(() =>
    this.recipe.status() === 'resolved'
      ? (this.recipe.value()?.steps.length ?? 0)
      : 0,
  );

  isFirstStep = computed(() => this.stepIndex() === 0);

  isLastStep = computed(() => this.stepIndex() >= this._stepCount() - 1);

  detailLink(): string[] {
    return recipeDetailRouterHelper.detail(this.recipeId());
  }

  onPrevious(): void {
    this.stepIndex.update((index) => Math.max(0, index - 1));
  }

  onNext(): void {
    this.stepIndex.update((index) =>
      Math.min(this._stepCount() - 1, index + 1),
    );
  }
}
