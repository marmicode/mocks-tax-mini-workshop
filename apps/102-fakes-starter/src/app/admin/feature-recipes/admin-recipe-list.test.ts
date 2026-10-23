import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeList } from './admin-recipe-list.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
  steps: ['Cook the sauce.', 'Poach the eggs.', 'Serve.'],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [{ name: 'ricotta' }],
  steps: ['Bake.'],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
  steps: ['Blend.'],
};

describe(AdminRecipeList.name, () => {
  it('lists all recipes on load', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '2', '3'],
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
  });

  it('searches by keywords', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'lemon');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
  });

  it('searches by course', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
  });

  it('stops filtering by course when "All courses" is selected', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '2', '3'],
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
  });

  it('links to the edit and delete pages of each recipe', async () => {
    const { fixture } = mountAdminRecipeList({ recipes: [shakshuka] });
    await fixture.whenStable();

    expect(linkByText(fixture.nativeElement, 'Edit').getAttribute('href')).toBe(
      '/admin/recipes/shakshuka/edit',
    );
    expect(
      linkByText(fixture.nativeElement, 'Delete').getAttribute('href'),
    ).toBe('/admin/recipes/shakshuka/delete');
    expect(
      linkByText(fixture.nativeElement, 'New recipe').getAttribute('href'),
    ).toBe('/admin/recipes/new');
  });

  it('shows "No recipes found" when nothing matches', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'xyz');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No recipes found');
  });

  it('shows the number of recipes found', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('.count')?.textContent?.trim(),
    ).toBe('2 recipe(s)');
  });

  it('renders the recipes matching the keywords', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'ricotta');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
  });

  it('combines keywords and course', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'shak');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '2', '3'],
    ]);
  });

  it('keeps keywords when "All courses" is selected again', async () => {
    const { fixture } = mountAdminRecipeList({
      recipes: [shakshuka, cheesecake, hummus],
    });
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();
    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'hummus');
    await fixture.whenStable();
    expect(rows(fixture.nativeElement)).toEqual([]);

    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Hummus with Ful', 'starter', '2', '1'],
    ]);
  });
});

function mountAdminRecipeList({
  recipes = [shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const fixture = TestBed.createComponent(AdminRecipeList);
  return { fixture };
}

function rows(root: HTMLElement): string[][] {
  return [...root.querySelectorAll('[data-testid="recipe-row"]')].map((row) =>
    [...row.querySelectorAll('td')]
      .slice(0, 4)
      .map((cell) => cell.textContent?.trim() ?? ''),
  );
}

function inputByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const field = [...root.querySelectorAll('mat-form-field')].find(
    (el) => el.querySelector('mat-label')?.textContent?.trim() === label,
  );
  const input = field?.querySelector('input');
  if (input == null) {
    throw new Error(`Input "${label}" not found.`);
  }
  return input;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function selectCourse(root: HTMLElement, course: string): void {
  const select = root.querySelector('select');
  if (select == null) {
    throw new Error('Course select not found.');
  }
  select.value = course;
  select.dispatchEvent(new Event('change'));
}

function linkByText(root: HTMLElement, text: string): HTMLAnchorElement {
  const link = [...root.querySelectorAll('a')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (link == null) {
    throw new Error(`Link "${text}" not found.`);
  }
  return link;
}
