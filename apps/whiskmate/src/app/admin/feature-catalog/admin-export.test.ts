import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it, onTestFinished, vi } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminExport } from './admin-export.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(AdminExport, () => {
  it('searches all recipes without a course filter', async () => {
    const lambShoulder = recipeMother
      .withBasicInfo('Slow-Roasted Lamb Shoulder')
      .withManyIngredients()
      .build();
    const kofte = recipeMother
      .withBasicInfo('Lamb Kofte')
      .withManySteps()
      .build();
    mountAdminExport({
      recipes: [shakshuka, cheesecake, lambShoulder, kofte],
    });

    await expect
      .element(page.getByTestId('export-count'))
      .toHaveTextContent('4 recipe(s) to export');
    expect(previewJson()).toEqual([shakshuka, cheesecake, lambShoulder, kofte]);
  });

  it('previews the exported recipes as JSON', async () => {
    mountAdminExport();

    await expect
      .element(page.getByTestId('export-count'))
      .toHaveTextContent('2 recipe(s) to export');
    expect(previewJson()).toEqual([shakshuka, cheesecake]);
  });

  it('exports a single course', async () => {
    mountAdminExport();

    await expect.element(page.getByTestId('export-count')).toBeVisible();
    await page.getByLabelText('Course').selectOptions('dessert');

    await expect.poll(() => previewJson()).toEqual([cheesecake]);
  });

  it('goes back to all courses', async () => {
    mountAdminExport();

    await expect.element(page.getByTestId('export-count')).toBeVisible();
    await page.getByLabelText('Course').selectOptions('main');
    await expect.poll(() => previewJson()).toEqual([shakshuka]);
    await page.getByLabelText('Course').selectOptions('');

    await expect.poll(() => previewJson()).toEqual([shakshuka, cheesecake]);
  });

  it('downloads the recipes as recipes.json', async () => {
    mountAdminExport();
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:recipes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    onTestFinished(() => {
      vi.restoreAllMocks();
    });

    await expect.element(page.getByTestId('export-count')).toBeVisible();
    await page.getByRole('button', { name: 'Download recipes.json' }).click();

    const blob = createObjectURL.mock.lastCall?.[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual([shakshuka, cheesecake]);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('recipes.json');
    expect(link.href).toBe('blob:recipes');
  });

  it('previews an empty export when the catalog is empty', async () => {
    mountAdminExport({ recipes: [] });

    await expect
      .element(page.getByTestId('export-count'))
      .toHaveTextContent('0 recipe(s) to export');
    expect(previewJson()).toEqual([]);
  });

  it('switches from one course to another', async () => {
    mountAdminExport();

    await expect.element(page.getByTestId('export-count')).toBeVisible();
    await page.getByLabelText('Course').selectOptions('main');
    await expect.poll(() => previewJson()).toEqual([shakshuka]);
    await page.getByLabelText('Course').selectOptions('dessert');

    await expect
      .element(page.getByTestId('export-count'))
      .toHaveTextContent('1 recipe(s) to export');
    expect(previewJson()).toEqual([cheesecake]);
  });

  it('counts the recipes to export again after going back to all courses', async () => {
    mountAdminExport();

    await expect.element(page.getByTestId('export-count')).toBeVisible();
    await page.getByLabelText('Course').selectOptions('main');
    await expect
      .element(page.getByTestId('export-count'))
      .toHaveTextContent('1 recipe(s) to export');

    await page.getByLabelText('Course').selectOptions('');

    await expect
      .element(page.getByTestId('export-count'))
      .toHaveTextContent('2 recipe(s) to export');
  });

  it('downloads only the recipes of the selected course', async () => {
    mountAdminExport();
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:recipes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    onTestFinished(() => {
      vi.restoreAllMocks();
    });

    await expect.element(page.getByTestId('export-count')).toBeVisible();
    await page.getByLabelText('Course').selectOptions('main');
    await expect
      .element(page.getByTestId('export-count'))
      .toHaveTextContent('1 recipe(s) to export');
    await page.getByRole('button', { name: 'Download recipes.json' }).click();

    const blob = createObjectURL.mock.lastCall?.[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual([shakshuka]);
  });
});

function mountAdminExport({
  recipes = [shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminExport);
}

function previewJson() {
  return JSON.parse(
    page.getByTestId('export-preview').element().textContent?.trim() ?? '',
  );
}
