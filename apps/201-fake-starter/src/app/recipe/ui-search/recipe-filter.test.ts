import { TestBed } from '@angular/core/testing';
import { describe, it } from 'vitest';
import type { RecipeFilterCriteria } from '@whiskmate/recipe/model';
import { RecipeFilter } from './recipe-filter.ng';

describe(RecipeFilter.name, () => {
  it('emits the selected course', async () => {
    const { fixture, filterChanges } = mountRecipeFilter();
    await fixture.whenStable();

    clickCourse(fixture.nativeElement, 'starter');
    await fixture.whenStable();

    expect(filterChanges.at(-1)).toEqual({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
  });

  it('emits every selected course', async () => {
    const { fixture, filterChanges } = mountRecipeFilter();
    await fixture.whenStable();

    clickCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(filterChanges.at(-1)).toEqual({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main', 'dessert'],
    });
  });

  it('emits `null` when all courses are unselected', async () => {
    const { fixture, filterChanges } = mountRecipeFilter();
    await fixture.whenStable();

    clickCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    clickCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();

    expect(filterChanges).toHaveLength(2);
    expect(filterChanges.at(-1)).toEqual({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: null,
    });
  });
});

function mountRecipeFilter() {
  const fixture = TestBed.createComponent(RecipeFilter);
  const filterChanges: RecipeFilterCriteria[] = [];
  fixture.componentInstance.filter.subscribe((filter) =>
    filterChanges.push(filter),
  );
  return { fixture, filterChanges };
}

function clickCourse(root: HTMLElement, course: string): void {
  const toggle = [...root.querySelectorAll('mat-button-toggle')].find(
    (el) => el.textContent?.trim() === course,
  );
  const button = toggle?.querySelector('button');
  if (button == null) {
    throw new Error(`Course "${course}" not found.`);
  }
  button.click();
}
