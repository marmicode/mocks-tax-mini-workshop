import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminExport } from './admin-export.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

describe(AdminExport.name, () => {
  it('searches all recipes without a course filter', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(search.mock.lastCall?.[0]).not.toHaveProperty('courses');
  });

  it('previews the exported recipes as JSON', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '2 recipe(s) to export',
    );
    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([shakshuka, cheesecake]);
  });

  it('exports a single course', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();
    search.mockReturnValue(of([cheesecake]));

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([cheesecake]);
  });

  it('goes back to all courses', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('downloads the recipes as recipes.json', async () => {
    const { fixture, search } = mountAdminExport();
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:recipes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Download recipes.json').click();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    const blob = createObjectURL.mock.lastCall?.[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual([shakshuka, cheesecake]);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('recipes.json');
    expect(link.href).toBe('blob:recipes');
  });
});

function mountAdminExport() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([shakshuka, cheesecake]));

  const fixture = TestBed.createComponent(AdminExport);

  return { fixture, search };
}

function textByTestId(root: HTMLElement, testId: string): string {
  return (
    root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? ''
  );
}

function selectCourse(root: HTMLElement, course: string): void {
  const select = root.querySelector<HTMLSelectElement>(
    'select[aria-label="Course"]',
  );
  if (select == null) {
    throw new Error('Course select not found.');
  }
  select.value = course;
  select.dispatchEvent(new Event('change'));
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
