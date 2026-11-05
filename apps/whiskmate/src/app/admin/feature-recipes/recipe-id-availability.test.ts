import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeIdAvailability } from './recipe-id-availability';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeIdAvailability.name, () => {
  it('reports an unknown id as available', async () => {
    const { availability, findById } = setUpRecipeIdAvailability();
    findById.mockReturnValue(of(undefined));

    const available = await firstValueFrom(availability.isAvailable('falafel'));

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'falafel' });
    expect(available).toBe(true);
  });

  it('reports an existing id as taken', async () => {
    const { availability, findById } = setUpRecipeIdAvailability();
    findById.mockReturnValue(of(shakshuka));

    const available = await firstValueFrom(
      availability.isAvailable('shakshuka'),
    );

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(available).toBe(false);
  });

  it('trims the id before looking it up', async () => {
    const { availability, findById } = setUpRecipeIdAvailability();
    findById.mockReturnValue(of(shakshuka));

    const available = await firstValueFrom(
      availability.isAvailable('  shakshuka  '),
    );

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(available).toBe(false);
  });

  it('does not look up an empty id', async () => {
    const { availability, findById } = setUpRecipeIdAvailability();

    const available = await firstValueFrom(availability.isAvailable('  '));

    expect(findById).not.toHaveBeenCalled();
    expect(available).toBe(true);
  });
});

function setUpRecipeIdAvailability() {
  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(undefined));
  const availability = TestBed.inject(RecipeIdAvailability);
  return { availability, findById };
}
