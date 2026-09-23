import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MealPlanExporter } from '@whiskmate/meal-plan/domain';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import { mealPlanRouterHelper } from './meal-plan.router-helper';

@Component({
  selector: 'wm-meal-plan-share',
  imports: [RouterLink],
  template: `
    <h2>Share this week's meal plan</h2>
    <div class="wm-surface">
      @if (text.hasValue()) {
        <pre data-testid="meal-plan-text">{{ text.value() }}</pre>
      }
      <div class="wm-toolbar">
        @if (text.hasValue() && canCopy) {
          <button
            type="button"
            class="wm-button-primary"
            (click)="onCopy(text.value())"
          >
            {{ copied() ? 'Copied!' : 'Copy' }}
          </button>
        }
        <a
          class="wm-button wm-button-outlined"
          [routerLink]="routerHelper.mealPlan()"
          >Back to meal plan</a
        >
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .wm-surface {
      max-width: 640px;
    }

    pre {
      font: var(--mat-sys-body-large);
      line-height: 1.8;
      margin: 0 0 1rem;
    }

    .wm-toolbar {
      margin: 0;
    }
  `,
})
export class MealPlanShare {
  protected readonly routerHelper = mealPlanRouterHelper;
  protected readonly canCopy = navigator.clipboard != null;

  private readonly _store = inject(MealPlanStore);
  private readonly _exporter = inject(MealPlanExporter);

  copied = signal(false);

  text = rxResource({
    params: () => this._store.assignments(),
    stream: ({ params }) => this._exporter.toText(params),
  });

  async onCopy(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
    this.copied.set(true);
  }
}
