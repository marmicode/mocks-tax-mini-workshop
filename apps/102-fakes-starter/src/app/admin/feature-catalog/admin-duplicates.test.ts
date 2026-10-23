import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminDuplicates } from './admin-duplicates.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const fulHummus = recipeMother.withBasicInfo('Ful & Hummus').build();

const aubergine = recipeMother
  .withBasicInfo('Burnt Aubergine Salad')
  .withIngredients([
    { name: 'aubergines' },
    { name: 'tahini' },
    { name: 'lemon juice' },
    { name: 'pomegranate' },
    { name: 'parsley' },
  ])
  .build();

const roastedAubergine = recipeMother
  .withBasicInfo('Roasted Aubergine with Tahini')
  .withIngredients([
    { name: 'Aubergines' },
    { name: 'tahini' },
    { name: 'lemon juice' },
    { name: 'pomegranate' },
    { name: 'mint' },
  ])
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

describe(AdminDuplicates.name, () => {
  it('shows "no duplicates" when every recipe is distinct', async () => {
    const { fixture } = mountAdminDuplicates({ recipes: [hummus, shakshuka] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-duplicates"]')
        ?.textContent,
    ).toContain('No duplicates found');
  });

  it('pairs recipes with the same normalized name', async () => {
    const { fixture } = mountAdminDuplicates({
      recipes: [hummus, shakshuka, fulHummus],
    });
    await fixture.whenStable();

    expect(pairTexts(fixture.nativeElement)).toEqual([
      'Hummus with Ful ↔ Ful & Hummus (same name)',
    ]);
  });

  it('pairs recipes sharing most of their ingredients', async () => {
    const { fixture } = mountAdminDuplicates({
      recipes: [aubergine, roastedAubergine, shakshuka],
    });
    await fixture.whenStable();

    expect(pairTexts(fixture.nativeElement)).toEqual([
      'Burnt Aubergine Salad ↔ Roasted Aubergine with Tahini (same ingredients)',
    ]);
  });

  it('links each duplicate to its edit page', async () => {
    const { fixture } = mountAdminDuplicates({ recipes: [hummus, fulHummus] });
    await fixture.whenStable();

    const links = [
      ...fixture.nativeElement.querySelectorAll(
        '[data-testid="duplicate-pair"] a',
      ),
    ].map((link) => (link as HTMLAnchorElement).getAttribute('href'));
    expect(links).toEqual([
      `/admin/recipes/${hummus.id}/edit`,
      `/admin/recipes/${fulHummus.id}/edit`,
    ]);
  });

  it('shows "no duplicates" when the catalog is empty', async () => {
    const { fixture } = mountAdminDuplicates({ recipes: [] });
    await fixture.whenStable();

    expect(pairTexts(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-duplicates"]')
        ?.textContent,
    ).toContain('No duplicates found');
  });

  it('does not pair recipes sharing only some of their ingredients', async () => {
    const { fixture } = mountAdminDuplicates({
      recipes: [
        aubergine,
        recipeMother
          .withBasicInfo('Roasted Aubergine with Tahini')
          .withIngredients([
            { name: 'aubergines' },
            { name: 'tahini' },
            { name: 'lemon juice' },
            { name: 'garlic' },
            { name: 'mint' },
          ])
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-duplicates"]'),
    ).not.toBeNull();
  });

  it('reports same-name recipes as name duplicates even if ingredients match too', async () => {
    const { fixture } = mountAdminDuplicates({
      recipes: [
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withIngredients([{ name: 'chickpeas' }, { name: 'tahini' }])
          .build(),
        recipeMother
          .withBasicInfo('hummus with ful!')
          .withId('hummus-copy')
          .withIngredients([{ name: 'chickpeas' }, { name: 'tahini' }])
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(pairTexts(fixture.nativeElement)).toEqual([
      'Hummus with Ful ↔ hummus with ful! (same name)',
    ]);
  });

  it('pairs every combination of duplicates', async () => {
    const { fixture } = mountAdminDuplicates({
      recipes: [
        hummus,
        fulHummus,
        recipeMother.withBasicInfo('Ful with Hummus').build(),
      ],
    });
    await fixture.whenStable();

    expect(pairTexts(fixture.nativeElement)).toEqual([
      'Hummus with Ful ↔ Ful & Hummus (same name)',
      'Hummus with Ful ↔ Ful with Hummus (same name)',
      'Ful & Hummus ↔ Ful with Hummus (same name)',
    ]);
  });
});

function mountAdminDuplicates({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminDuplicates);

  return { fixture };
}

function pairTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="duplicate-pair"]')].map(
    (el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}
