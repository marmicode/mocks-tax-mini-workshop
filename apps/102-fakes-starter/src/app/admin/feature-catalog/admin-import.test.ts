import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, vi } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminImport } from './admin-import.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const updatedShakshuka = recipeMother
  .withBasicInfo({
    name: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato sauce.',
  })
  .build();

const brownies = recipeMother
  .withBasicInfo('Tahini and Halva Brownies')
  .build();

describe(AdminImport.name, () => {
  it('does not touch the catalog before importing', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminImport();
    await fixture.whenStable();

    pasteJson(fixture.nativeElement, JSON.stringify([brownies]));
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka]);
    expect(textByTestId(fixture.nativeElement, 'import-ready')).toBe(
      '1 valid recipe(s) ready to import',
    );
  });

  it('rejects invalid JSON', async () => {
    const { fixture } = mountAdminImport();
    await fixture.whenStable();

    pasteJson(fixture.nativeElement, '[{');
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'import-error')).toBe(
      'Invalid JSON.',
    );
  });

  it('rejects recipes with an unknown course', async () => {
    const { fixture } = mountAdminImport();
    await fixture.whenStable();

    pasteJson(
      fixture.nativeElement,
      JSON.stringify([brownies, { ...shakshuka, course: 'brunch' }]),
    );
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'import-error')).toContain(
      'Recipe #2 is invalid',
    );
  });

  it('creates new recipes and updates existing ones', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminImport();
    await fixture.whenStable();

    pasteJson(
      fixture.nativeElement,
      JSON.stringify([updatedShakshuka, brownies]),
    );
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Import').click();
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([
      updatedShakshuka,
      brownies,
    ]);
  });

  it('shows how many recipes were created and updated', async () => {
    const { fixture } = mountAdminImport();
    await fixture.whenStable();

    pasteJson(
      fixture.nativeElement,
      JSON.stringify([updatedShakshuka, brownies]),
    );
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Import').click();
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'import-summary')).toBe(
      '1 created, 1 updated',
    );
  });

  it('creates every recipe when the catalog is empty', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminImport({
      recipes: [],
    });
    await fixture.whenStable();

    pasteJson(
      fixture.nativeElement,
      JSON.stringify([updatedShakshuka, brownies]),
    );
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Import').click();
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([
      updatedShakshuka,
      brownies,
    ]);
    expect(textByTestId(fixture.nativeElement, 'import-summary')).toBe(
      '2 created, 0 updated',
    );
  });

  it('updates every recipe that already exists', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminImport({
      recipes: [shakshuka, brownies],
    });
    await fixture.whenStable();

    pasteJson(
      fixture.nativeElement,
      JSON.stringify([updatedShakshuka, brownies]),
    );
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Import').click();
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([
      updatedShakshuka,
      brownies,
    ]);
    expect(textByTestId(fixture.nativeElement, 'import-summary')).toBe(
      '0 created, 2 updated',
    );
  });

  it('hides the summary once the JSON is edited again', async () => {
    const { fixture } = mountAdminImport();
    await fixture.whenStable();

    pasteJson(fixture.nativeElement, JSON.stringify([brownies]));
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Import').click();
    await fixture.whenStable();
    pasteJson(fixture.nativeElement, JSON.stringify([shakshuka, brownies]));
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="import-summary"]'),
    ).toBeNull();
    expect(textByTestId(fixture.nativeElement, 'import-ready')).toBe(
      '2 valid recipe(s) ready to import',
    );
  });

  it('imports recipes from a picked file', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminImport();
    await fixture.whenStable();

    await pickFile(
      fixture.nativeElement,
      new File([JSON.stringify([brownies])], 'recipes.json', {
        type: 'application/json',
      }),
    );
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Import').click();
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([
      shakshuka,
      brownies,
    ]);
  });
});

function mountAdminImport({
  recipes = [shakshuka],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminImport);

  return { fixture, recipeRepositoryFake };
}

function pasteJson(root: HTMLElement, json: string): void {
  const textarea = root.querySelector<HTMLTextAreaElement>(
    'textarea[aria-label="Recipes JSON"]',
  );
  if (textarea == null) {
    throw new Error('Recipes JSON textarea not found.');
  }
  textarea.value = json;
  textarea.dispatchEvent(new Event('input'));
}

async function pickFile(root: HTMLElement, file: File): Promise<void> {
  const input = root.querySelector<HTMLInputElement>(
    'input[aria-label="Recipes file"]',
  );
  if (input == null) {
    throw new Error('Recipes file input not found.');
  }
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event('change'));
  await vi.waitFor(() => {
    if (root.querySelector('[data-testid="import-ready"]') == null) {
      throw new Error('File not loaded yet.');
    }
  });
}

function textByTestId(root: HTMLElement, testId: string): string {
  return (
    root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? ''
  );
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
