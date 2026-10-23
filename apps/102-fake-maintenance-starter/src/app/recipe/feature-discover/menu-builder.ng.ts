import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MenuGenerator } from '@whiskmate/recipe/domain';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import { COURSES, type Course } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';
import { Card, WeekdayPicker } from '@whiskmate/shared/ui';

@Component({
  selector: 'wm-menu-builder',
  imports: [Card, RouterLink, WeekdayPicker],
  template: `
    <h2>Menu builder</h2>
    <div class="wm-toolbar">
      <button type="button" (click)="menu.reload()">New menu</button>
      <button
        type="button"
        class="wm-button-primary"
        [disabled]="!canAddToMealPlan()"
        (click)="pickerOpen.set(true)"
      >
        Add menu to meal plan
      </button>
    </div>
    @if (pickerOpen()) {
      <wm-weekday-picker
        (select)="onAddToMealPlan($event)"
        (dismissed)="pickerOpen.set(false)"
      />
    }
    @if (addedTo(); as weekday) {
      <p data-testid="added-message">Menu planned for {{ weekday }}.</p>
    }
    @if (menu.hasValue()) {
      <div class="courses">
        @for (course of courses; track course) {
          <section [attr.data-testid]="'course-' + course">
            <header>
              <h3>{{ course }}</h3>
              <button
                type="button"
                class="wm-button-outlined swap"
                [attr.aria-label]="'Swap ' + course"
                (click)="onSwap(course)"
              >
                Swap
              </button>
            </header>
            @if (menu.value()[course]; as recipe) {
              <wm-card
                [pictureUri]="recipe.pictureUri"
                [pictureAlt]="recipe.name"
              >
                <a
                  data-testid="recipe-name"
                  [routerLink]="detailRoute(recipe.id)"
                  >{{ recipe.name }}</a
                >
              </wm-card>
            } @else {
              <p class="wm-muted" data-testid="no-recipe">
                No {{ course }} available.
              </p>
            }
          </section>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    wm-weekday-picker {
      margin-bottom: 1rem;
    }

    [data-testid='added-message'] {
      background: var(--mat-sys-primary-container);
      border-radius: 12px;
      color: var(--mat-sys-on-primary-container);
      padding: 0.75rem 1rem;
    }

    .courses {
      --wm-card-width: 100%;

      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    header {
      align-items: center;
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    h3 {
      margin: 0;
      text-transform: capitalize;
    }

    .swap {
      height: 32px;
    }

    .swap::before {
      content: 'refresh';
      font-family: 'Material Icons';
      font-size: 18px;
    }

    wm-card a {
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-title-medium);
    }
  `,
})
export class MenuBuilder {
  readonly courses = COURSES;

  pickerOpen = signal(false);
  addedTo = signal<Weekday | null>(null);

  private _menuGenerator = inject(MenuGenerator);
  private _mealPlanStore = inject(MealPlanStore);
  private _destroyRef = inject(DestroyRef);

  menu = rxResource({
    stream: () => this._menuGenerator.generate(),
  });

  canAddToMealPlan = computed(
    () => this.menu.hasValue() && this.menu.value().main != null,
  );

  onSwap(course: Course): void {
    if (!this.menu.hasValue()) {
      return;
    }

    this._menuGenerator
      .regenerate(course, this.menu.value()[course])
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((recipe) =>
        this.menu.update((menu) => menu && { ...menu, [course]: recipe }),
      );
  }

  onAddToMealPlan(weekday: Weekday): void {
    const main = this.menu.hasValue() ? this.menu.value().main : null;
    this.pickerOpen.set(false);
    if (main == null) {
      return;
    }

    this._mealPlanStore.assign({ weekday, recipeId: main.id });
    this.addedTo.set(weekday);
  }

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
