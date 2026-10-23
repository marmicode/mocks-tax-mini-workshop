import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminIdAudit } from './admin-id-audit.ng';

describe(AdminIdAudit.name, () => {
  it('accepts a kebab-case id matching the name', async () => {
    const { fixture } = mountAdminIdAudit({
      recipes: [recipeMother.withBasicInfo('Courgette Fritters').build()],
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe('All ids look good.');
  });

  it('flags ids that are not kebab-case', async () => {
    const { fixture } = mountAdminIdAudit({
      recipes: [
        recipeMother.withBasicInfo('Shakshuka').withId('Shakshuka_v2').build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Shakshuka_v2 Not kebab-case shakshuka',
    ]);
  });

  it('flags kebab-case ids that do not match the name', async () => {
    const { fixture } = mountAdminIdAudit({
      recipes: [
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withId('hummus-ful')
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'hummus-ful Does not match name hummus-with-ful',
    ]);
  });

  it('suggests ids without accents or punctuation', async () => {
    const { fixture } = mountAdminIdAudit({
      recipes: [
        recipeMother
          .withBasicInfo('Crème Brûlée (Classic!)')
          .withId('creme-brulee')
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'creme-brulee Does not match name creme-brulee-classic',
    ]);
  });
});

function mountAdminIdAudit({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminIdAudit);

  return { fixture };
}

function rowTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="id-audit-row"]')].map((row) =>
    [...row.querySelectorAll('td')]
      .map((cell) => cell.textContent?.trim())
      .join(' '),
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
