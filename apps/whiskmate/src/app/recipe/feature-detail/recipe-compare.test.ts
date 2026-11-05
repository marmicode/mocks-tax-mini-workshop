import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { RecipeCompare } from './recipe-compare.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: 'Olive oil' },
    { name: 'garlic, crushed' },
    { name: 'large eggs' },
  ])
  .withSteps(['Heat the oil.', 'Add the eggs.'])
  .build();

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .withIngredients([{ name: 'olive oil' }, { name: 'tahini' }])
  .withSteps(['Blitz everything.'])
  .build();

describe(RecipeCompare, () => {
  it('lists all recipes in the pickers', async () => {
    mountRecipeCompare({});

    await expect
      .poll(() => optionLabels('Left recipe'))
      .toEqual(['Pick a recipe', 'Shakshuka', 'Hummus with Ful']);
  });

  it('shows both compared recipes', async () => {
    mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
    });

    await expect
      .element(page.getByTestId('left-name'))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByTestId('right-name'))
      .toHaveTextContent('Hummus with Ful');
  });

  it('compares course, ingredient count and step count', async () => {
    mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
    });

    await expect
      .element(page.getByTestId('left-name'))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByTestId('right-name'))
      .toHaveTextContent('Hummus with Ful');
    await expect.poll(() => cellsOf('course-row')).toEqual(['main', 'starter']);
    await expect
      .poll(() => cellsOf('ingredient-count-row'))
      .toEqual(['3', '2']);
    await expect.poll(() => cellsOf('step-count-row')).toEqual(['2', '1']);
  });

  it('lists shared ingredients ignoring case', async () => {
    mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
    });

    await expect
      .poll(() => textsOf('shared-ingredient'))
      .toEqual(['olive oil']);
  });

  it('navigates when a recipe is picked', async () => {
    const { router } = mountRecipeCompare({});

    await expect
      .poll(() => optionLabels('Left recipe'))
      .toEqual(['Pick a recipe', 'Shakshuka', 'Hummus with Ful']);

    await page.getByRole('combobox', { name: 'Left recipe' }).selectOptions(hummus.id);

    await expect.poll(() => router.url).toBe(`/compare?left=${hummus.id}`);
  });

  it('preselects the compared recipes in the pickers', async () => {
    mountRecipeCompare({
      left: hummus.id,
      right: shakshuka.id,
    });

    await expect
      .element(page.getByRole('combobox', { name: 'Left recipe' }))
      .toHaveValue(hummus.id);
    await expect
      .element(page.getByRole('combobox', { name: 'Right recipe' }))
      .toHaveValue(shakshuka.id);
  });

  it('does not compare until both recipes are picked', async () => {
    mountRecipeCompare({
      left: shakshuka.id,
    });

    await expect
      .element(page.getByRole('combobox', { name: 'Left recipe' }))
      .toHaveValue(shakshuka.id);
    await expect.element(page.getByRole('table')).not.toBeInTheDocument();
  });

  it('tells when recipes share no ingredients', async () => {
    mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
      recipes: [
        shakshuka,
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withIngredients([{ name: 'tahini' }])
          .build(),
      ],
    });

    await expect
      .element(page.getByTestId('no-shared-ingredients'))
      .toHaveTextContent('No shared ingredients.');
  });

  it('clears a side when "Pick a recipe" is chosen', async () => {
    const { router } = mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
    });
    await router.navigateByUrl(
      `/compare?left=${shakshuka.id}&right=${hummus.id}`,
    );

    await expect
      .element(page.getByTestId('left-name'))
      .toHaveTextContent('Shakshuka');

    await page.getByRole('combobox', { name: 'Right recipe' }).selectOptions('Pick a recipe');

    await expect.poll(() => router.url).toBe(`/compare?left=${shakshuka.id}`);
  });
});

function mountRecipeCompare({
  left,
  right,
  recipes = [shakshuka, hummus],
}: {
  left?: string;
  right?: string;
  recipes?: Recipe[];
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'compare', children: [] }]),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const router = TestBed.inject(Router);

  TestBed.createComponent(RecipeCompare, {
    bindings: [
      inputBinding('left', () => left),
      inputBinding('right', () => right),
    ],
  });

  return { router };
}

function optionLabels(label: 'Left recipe' | 'Right recipe') {
  const select = page.getByRole('combobox', { name: label }).element() as HTMLSelectElement;
  return [...select.options].map((option) => option.text.trim());
}

function cellsOf(testId: string) {
  return [...page.getByTestId(testId).element().querySelectorAll('td')].map(
    (cell) => cell.textContent?.trim() ?? '',
  );
}

function textsOf(testId: string) {
  return page
    .getByTestId(testId)
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
