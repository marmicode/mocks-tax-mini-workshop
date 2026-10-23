import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminMissingDescriptions } from './admin-missing-descriptions.ng';

describe(AdminMissingDescriptions.name, () => {
  it('shows an empty state when every recipe has a description', async () => {
    const { fixture } = mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Shakshuka',
            description: 'Eggs poached in a spiced tomato sauce.',
          })
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe(
      'Every recipe has a description.',
    );
  });

  it('lists recipes with a null description', async () => {
    const { fixture } = mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Tahini and Halva Brownies',
          })
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowNames(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies',
    ]);
  });

  it('treats blank descriptions as missing and sorts by name', async () => {
    const { fixture } = mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Shakshuka', description: '   ' })
          .build(),
        recipeMother
          .withBasicInfo({
            name: 'Courgette Fritters',
            description: '',
          })
          .build(),
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
            description: 'Creamy hummus.',
          })
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowNames(fixture.nativeElement)).toEqual([
      'Courgette Fritters',
      'Shakshuka',
    ]);
  });

  it('summarizes how many recipes miss a description', async () => {
    const { fixture } = mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
            description: 'Creamy hummus.',
          })
          .build(),
        recipeMother.withBasicInfo('Shakshuka').build(),
      ],
    });
    await fixture.whenStable();

    expect(summary(fixture.nativeElement)).toBe('1 of 2 recipes');
  });
});

function mountAdminMissingDescriptions({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminMissingDescriptions);

  return { fixture };
}

function rowNames(root: HTMLElement): string[] {
  return [
    ...root.querySelectorAll('[data-testid="missing-description-row"]'),
  ].map((row) => row.textContent?.trim() ?? '');
}

function summary(root: HTMLElement): string | undefined {
  return root
    .querySelector('[data-testid="missing-description-summary"]')
    ?.textContent?.trim();
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
