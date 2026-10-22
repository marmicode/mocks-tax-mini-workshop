import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeCreate } from './admin-recipe-create.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const falafel: Recipe = {
  id: 'falafel-bowl',
  course: 'starter',
  name: 'Falafel Bowl',
  description: 'Crispy falafel with tahini.',
  pictureUri: 'https://example.com/falafel.jpg',
  ingredients: [
    { quantity: { amount: 400, unit: 'g' }, name: 'chickpeas' },
    { quantity: { amount: 2, unit: 'tbsp' }, name: 'tahini' },
    { name: 'fresh parsley' },
  ],
  steps: ['Blend the chickpeas.', 'Shape and fry.'],
};

describe(AdminRecipeCreate.name, () => {
  it('derives the id from the name and checks it is available', async () => {
    const { fixture, findById } = mountAdminRecipeCreate();
    await fixture.whenStable();

    typeInto(fieldByLabel(fixture.nativeElement, 'Name'), 'Falafel Bowl');
    await fixture.whenStable();

    expect(fieldByLabel(fixture.nativeElement, 'Id').value).toBe(
      'falafel-bowl',
    );
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'falafel-bowl' });
    expect(fixture.nativeElement.textContent).not.toContain(
      'This id is already taken',
    );
  });

  it('warns when the id is already taken and prevents creation', async () => {
    const { fixture, findById, create } = mountAdminRecipeCreate();
    findById.mockReturnValue(of(shakshuka));
    await fixture.whenStable();

    typeInto(fieldByLabel(fixture.nativeElement, 'Name'), 'Shakshuka');
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Create').click();
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(fixture.nativeElement.textContent).toContain(
      'This id is already taken',
    );
    expect(buttonByText(fixture.nativeElement, 'Create').disabled).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps a hand-edited id when the name changes', async () => {
    const { fixture, findById } = mountAdminRecipeCreate();
    await fixture.whenStable();

    typeInto(fieldByLabel(fixture.nativeElement, 'Id'), 'my-falafel');
    await fixture.whenStable();
    typeInto(fieldByLabel(fixture.nativeElement, 'Name'), 'Falafel Bowl');
    await fixture.whenStable();

    expect(fieldByLabel(fixture.nativeElement, 'Id').value).toBe('my-falafel');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'my-falafel' });
  });

  it('creates the recipe and goes back to the list', async () => {
    const { fixture, findById, create, navigate } = mountAdminRecipeCreate();
    await fixture.whenStable();

    fillRecipeForm(fixture.nativeElement);
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Create').click();
    await fixture.whenStable();

    expect(findById).toHaveBeenLastCalledWith({ id: 'falafel-bowl' });
    expect(create).toHaveBeenCalledExactlyOnceWith(falafel);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'admin', 'recipes']);
  });

  it('does not create a recipe without a name', async () => {
    const { fixture, findById, create } = mountAdminRecipeCreate();
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Create').click();
    await fixture.whenStable();

    expect(findById).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});

function mountAdminRecipeCreate() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(undefined));
  const create = vi
    .spyOn(recipeRepository, 'create')
    .mockImplementation((recipe) => of(recipe));
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);

  const fixture = TestBed.createComponent(AdminRecipeCreate);

  return { fixture, findById, create, navigate };
}

function fillRecipeForm(root: HTMLElement): void {
  typeInto(fieldByLabel(root, 'Name'), 'Falafel Bowl');
  selectValue(fieldByLabel(root, 'Course'), 'starter');
  typeInto(fieldByLabel(root, 'Description'), 'Crispy falafel with tahini.');
  typeInto(
    fieldByLabel(root, 'Picture URI'),
    'https://example.com/falafel.jpg',
  );
  typeInto(
    fieldByLabel(root, 'Ingredients (one per line)'),
    '400 g chickpeas\n2 tbsp tahini\nfresh parsley',
  );
  typeInto(
    fieldByLabel(root, 'Steps (one per line)'),
    'Blend the chickpeas.\n\nShape and fry.',
  );
}

type FormControlElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

function fieldByLabel(root: HTMLElement, label: string): FormControlElement {
  const field = [...root.querySelectorAll('mat-form-field')].find(
    (el) => el.querySelector('mat-label')?.textContent?.trim() === label,
  );
  const control = field?.querySelector<FormControlElement>(
    'input, textarea, select',
  );
  if (control == null) {
    throw new Error(`Field "${label}" not found.`);
  }
  return control;
}

function typeInto(control: FormControlElement, value: string): void {
  control.value = value;
  control.dispatchEvent(new Event('input'));
}

function selectValue(control: FormControlElement, value: string): void {
  control.value = value;
  control.dispatchEvent(new Event('change'));
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
