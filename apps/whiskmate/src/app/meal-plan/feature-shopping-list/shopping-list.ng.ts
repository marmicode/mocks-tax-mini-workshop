import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  ShoppingListBuilder,
  type ShoppingItem,
} from '@whiskmate/meal-plan/domain';
import { mealPlanRouterHelper } from '@whiskmate/meal-plan/feature-meal-plan';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';

@Component({
  selector: 'wm-shopping-list',
  imports: [MatCheckbox, MatIcon, RouterLink],
  template: `
    <h2>Shopping list</h2>
    @if (items.hasValue()) {
      @if (items.value().length === 0) {
        <div class="wm-surface empty">
          <mat-icon>shopping_cart</mat-icon>
          <p data-testid="empty-shopping-list">
            Nothing to buy yet.
            <a [routerLink]="mealPlanRouterHelper.mealPlan()"
              >Plan some meals</a
            >
            first.
          </p>
        </div>
      } @else {
        <div class="wm-surface list">
          <div class="progress">
            <p data-testid="items-left">{{ itemsLeftLabel() }}</p>
            <div class="bar">
              <div class="fill" [style.width.%]="progress()"></div>
            </div>
          </div>
          <ul>
            @for (item of items.value(); track keyOf(item)) {
              <li data-testid="shopping-item" [class.checked]="isChecked(item)">
                <mat-checkbox
                  [checked]="isChecked(item)"
                  (change)="onToggle(item)"
                >
                  <span class="text">{{ describe(item) }}</span>
                </mat-checkbox>
                <small class="from">for {{ item.from.join(', ') }}</small>
              </li>
            }
          </ul>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .list,
    .empty {
      max-width: 720px;
    }

    .empty {
      align-items: center;
      color: var(--mat-sys-on-surface-variant);
      display: flex;
      gap: 0.75rem;
    }

    .progress {
      margin-bottom: 0.5rem;

      p {
        font: var(--mat-sys-title-medium);
        margin: 0 0 0.5rem;
      }
    }

    .bar {
      background: var(--mat-sys-surface-container-high);
      border-radius: 999px;
      height: 6px;
      overflow: hidden;
    }

    .fill {
      background: var(--mat-sys-primary);
      height: 100%;
      transition: width 200ms;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      align-items: center;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      padding: 0.25rem 0;

      &:last-child {
        border-bottom: none;
      }

      &.checked .text {
        opacity: 0.55;
        text-decoration: line-through;
      }
    }

    .from {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
      margin-left: 0.5rem;
    }
  `,
})
export class ShoppingList {
  protected readonly mealPlanRouterHelper = mealPlanRouterHelper;

  private readonly _store = inject(MealPlanStore);
  private readonly _builder = inject(ShoppingListBuilder);
  private readonly _checkedKeys = signal(new Set<string>());

  items = rxResource({
    params: () => this._store.assignments(),
    stream: ({ params }) => this._builder.build(params),
  });

  itemsLeftLabel = computed(() => {
    const items = this.items.hasValue() ? this.items.value() : [];
    const left = items.filter(
      (item) => !this._checkedKeys().has(this.keyOf(item)),
    ).length;
    return left === 0
      ? 'All done 🎉'
      : `${left} ${left === 1 ? 'item' : 'items'} left`;
  });

  progress = computed(() => {
    const items = this.items.hasValue() ? this.items.value() : [];
    if (items.length === 0) {
      return 0;
    }
    const checked = items.filter((item) =>
      this._checkedKeys().has(this.keyOf(item)),
    ).length;
    return (checked / items.length) * 100;
  });

  keyOf(item: ShoppingItem): string {
    return `${item.name.toLowerCase()}|${item.quantity?.unit ?? ''}`;
  }

  describe({ name, quantity }: ShoppingItem): string {
    if (quantity == null) {
      return name;
    }
    return [quantity.amount, quantity.unit, name].filter(Boolean).join(' ');
  }

  isChecked(item: ShoppingItem): boolean {
    return this._checkedKeys().has(this.keyOf(item));
  }

  onToggle(item: ShoppingItem): void {
    const key = this.keyOf(item);
    this._checkedKeys.update((keys) => {
      const nextKeys = new Set(keys);
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
      return nextKeys;
    });
  }
}
