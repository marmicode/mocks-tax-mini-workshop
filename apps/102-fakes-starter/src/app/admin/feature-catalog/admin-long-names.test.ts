import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminLongNames } from './admin-long-names.ng';

describe(AdminLongNames.name, () => {
  it('shows an empty state when every name is short enough', async () => {
    const { fixture } = mountAdminLongNames({
      recipes: [recipeMother.withBasicInfo('Shakshuka').build()],
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe(
      'Every name fits within 30 characters.',
    );
  });

  it('lists names longer than 30 characters by default', async () => {
    const { fixture } = mountAdminLongNames({
      recipes: [
        recipeMother
          .withBasicInfo('Slow-Roasted Lamb Shoulder with Pomegranate')
          .build(),
        recipeMother.withBasicInfo('Hummus with Ful').build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Slow-Roasted Lamb Shoulder with Pomegranate (43)',
    ]);
  });

  it('sorts the longest names first', async () => {
    const { fixture } = mountAdminLongNames({
      recipes: [
        recipeMother
          .withBasicInfo('Tahini and Halva Brownies with Sea Salt')
          .build(),
        recipeMother
          .withBasicInfo('Slow-Roasted Lamb Shoulder with Pomegranate')
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Slow-Roasted Lamb Shoulder with Pomegranate (43)',
      'Tahini and Halva Brownies with Sea Salt (39)',
    ]);
  });

  it('applies a custom max length', async () => {
    const { fixture } = mountAdminLongNames({
      recipes: [
        recipeMother.withBasicInfo('Hummus with Ful').build(),
        recipeMother.withBasicInfo('Shakshuka').build(),
      ],
    });
    await fixture.whenStable();

    const input = maxLengthInput(fixture.nativeElement);
    input.value = '10';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual(['Hummus with Ful (15)']);
  });
});

function mountAdminLongNames({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminLongNames);

  return { fixture };
}

function rowTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="long-name-row"]')].map(
    (row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

function maxLengthInput(root: HTMLElement): HTMLInputElement {
  const input = [...root.querySelectorAll('label')]
    .find((el) => el.textContent?.trim() === 'Max length')
    ?.querySelector('input');
  if (input == null) {
    throw new Error('Max length input not found.');
  }
  return input;
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
