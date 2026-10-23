import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeEdit } from './admin-recipe-edit.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
    { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
    { name: 'fresh coriander' },
  ],
  steps: ['Cook the sauce.', 'Poach the eggs.'],
};

describe(AdminRecipeEdit.name, () => {
  it('fetches the recipe and prefills the form', async () => {
    const { fixture, findById } = mountAdminRecipeEdit('shakshuka');
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(fieldByLabel(fixture.nativeElement, 'Name').value).toBe('Shakshuka');
    expect(fieldByLabel(fixture.nativeElement, 'Course').value).toBe('main');
    expect(
      fieldByLabel(fixture.nativeElement, 'Ingredients (one per line)').value,
    ).toBe('3 tbsp olive oil\n6 large eggs\nfresh coriander');
    expect(
      fieldByLabel(fixture.nativeElement, 'Steps (one per line)').value,
    ).toBe('Cook the sauce.\nPoach the eggs.');
  });

  it('does not allow changing the id', async () => {
    const { fixture, findById } = mountAdminRecipeEdit('shakshuka');
    await fixture.whenStable();

    const idField = fieldByLabel(fixture.nativeElement, 'Id');

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(idField.value).toBe('shakshuka');
    expect((idField as HTMLInputElement).readOnly).toBe(true);
  });

  it('saves an unchanged recipe as is', async () => {
    const { fixture, findById, update } = mountAdminRecipeEdit('shakshuka');
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Save').click();
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(update).toHaveBeenCalledExactlyOnceWith(shakshuka);
  });

  it('updates the recipe and goes back to the list', async () => {
    const { fixture, findById, update, navigate } =
      mountAdminRecipeEdit('shakshuka');
    await fixture.whenStable();

    typeInto(fieldByLabel(fixture.nativeElement, 'Name'), 'Green Shakshuka');
    selectValue(fieldByLabel(fixture.nativeElement, 'Course'), 'starter');
    typeInto(fieldByLabel(fixture.nativeElement, 'Description'), '');
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Save').click();
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(update).toHaveBeenCalledExactlyOnceWith({
      id: 'shakshuka',
      course: 'starter',
      name: 'Green Shakshuka',
      description: null,
      pictureUri: 'https://example.com/shakshuka.jpg',
      ingredients: [
        { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
        { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
        { name: 'fresh coriander' },
      ],
      steps: ['Cook the sauce.', 'Poach the eggs.'],
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'admin', 'recipes']);
  });

  it('shows "Recipe not found" for an unknown recipe', async () => {
    const { fixture, findById, update } = mountAdminRecipeEdit('missing');
    findById.mockReturnValue(of(undefined));
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(fixture.nativeElement.textContent).toContain('Recipe not found');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });
});

function mountAdminRecipeEdit(recipeId: string) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(shakshuka));
  const update = vi
    .spyOn(recipeRepository, 'update')
    .mockImplementation((recipe) => of(recipe));
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);

  const fixture = TestBed.createComponent(AdminRecipeEdit);
  fixture.componentRef.setInput('recipeId', recipeId);

  return { fixture, findById, update, navigate };
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
