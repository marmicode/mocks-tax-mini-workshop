import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
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

describe(AdminDuplicates, () => {
  it('searches all recipes', async () => {
    mountAdminDuplicates({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .build(),
        recipeMother
          .withBasicInfo('Ricotta & Lemon Cheesecake')
          .withManyIngredients()
          .build(),
        recipeMother
          .withBasicInfo('Cheesecake with Lemon and Ricotta')
          .withManySteps()
          .build(),
      ],
    });

    await expect
      .poll(() => pairTexts())
      .toEqual([
        'Lemon and Ricotta Cheesecake ↔ Ricotta & Lemon Cheesecake (same name)',
        'Lemon and Ricotta Cheesecake ↔ Cheesecake with Lemon and Ricotta (same name)',
        'Ricotta & Lemon Cheesecake ↔ Cheesecake with Lemon and Ricotta (same name)',
      ]);
  });

  it('shows "no duplicates" when every recipe is distinct', async () => {
    mountAdminDuplicates({ recipes: [hummus, shakshuka] });

    await expect
      .element(page.getByTestId('no-duplicates'))
      .toMatchTextContent('No duplicates found');
  });

  it('pairs recipes with the same normalized name', async () => {
    mountAdminDuplicates({
      recipes: [hummus, shakshuka, fulHummus],
    });

    await expect
      .poll(() => pairTexts())
      .toEqual(['Hummus with Ful ↔ Ful & Hummus (same name)']);
  });

  it('pairs recipes sharing most of their ingredients', async () => {
    mountAdminDuplicates({
      recipes: [aubergine, roastedAubergine, shakshuka],
    });

    await expect
      .poll(() => pairTexts())
      .toEqual([
        'Burnt Aubergine Salad ↔ Roasted Aubergine with Tahini (same ingredients)',
      ]);
  });

  it('links each duplicate to its edit page', async () => {
    mountAdminDuplicates({ recipes: [hummus, fulHummus] });

    await expect.element(page.getByTestId('duplicate-pair')).toBeVisible();
    expect(editLinks()).toEqual([
      `/admin/recipes/${hummus.id}/edit`,
      `/admin/recipes/${fulHummus.id}/edit`,
    ]);
  });

  it('shows "no duplicates" when the catalog is empty', async () => {
    mountAdminDuplicates({ recipes: [] });

    await expect
      .element(page.getByTestId('no-duplicates'))
      .toMatchTextContent('No duplicates found');
    await expect.poll(() => pairTexts()).toEqual([]);
  });

  it('does not pair recipes sharing only some of their ingredients', async () => {
    mountAdminDuplicates({
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

    await expect.element(page.getByTestId('no-duplicates')).toBeVisible();
  });

  it('reports same-name recipes as name duplicates even if ingredients match too', async () => {
    mountAdminDuplicates({
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

    await expect
      .poll(() => pairTexts())
      .toEqual(['Hummus with Ful ↔ hummus with ful! (same name)']);
  });

  it('pairs every combination of duplicates', async () => {
    mountAdminDuplicates({
      recipes: [
        hummus,
        fulHummus,
        recipeMother.withBasicInfo('Ful with Hummus').build(),
      ],
    });

    await expect
      .poll(() => pairTexts())
      .toEqual([
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

  TestBed.createComponent(AdminDuplicates);
}

function pairTexts() {
  return page
    .getByTestId('duplicate-pair')
    .elements()
    .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

function editLinks() {
  return page
    .getByTestId('duplicate-pair')
    .getByRole('link')
    .elements()
    .map((link) => link.getAttribute('href'));
}
