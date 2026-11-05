import type {
  Course,
  Ingredient,
  Recipe,
} from '@whiskmate/shared-recipe/model';

/**
 * Editable representation of a recipe.
 * Ingredients and steps are entered one per line.
 */
export interface RecipeDraft {
  id: string;
  name: string;
  course: Course;
  description: string;
  pictureUri: string;
  ingredients: string;
  steps: string;
}

export function createEmptyRecipeDraft(): RecipeDraft {
  return {
    id: '',
    name: '',
    course: 'main',
    description: '',
    pictureUri: '',
    ingredients: '',
    steps: '',
  };
}

export function toRecipeDraft(recipe: Recipe): RecipeDraft {
  return {
    id: recipe.id,
    name: recipe.name,
    course: recipe.course,
    description: recipe.description ?? '',
    pictureUri: recipe.pictureUri,
    ingredients: recipe.ingredients.map(formatIngredient).join('\n'),
    steps: recipe.steps.join('\n'),
  };
}

export function toRecipe(draft: RecipeDraft): Recipe {
  return {
    id: draft.id.trim(),
    name: draft.name.trim(),
    course: draft.course,
    description: draft.description.trim() || null,
    pictureUri: draft.pictureUri.trim(),
    ingredients: toLines(draft.ingredients).map(parseIngredient),
    steps: toLines(draft.steps),
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const QUANTITY_UNITS = ['g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cloves'];

function formatIngredient({ quantity, name }: Ingredient): string {
  if (quantity == null) {
    return name;
  }
  return [quantity.amount, quantity.unit, name].filter(Boolean).join(' ');
}

function parseIngredient(line: string): Ingredient {
  const [first, second, ...rest] = line.split(' ');
  const amount = Number(first);
  if (first === '' || Number.isNaN(amount) || second == null) {
    return { name: line };
  }

  if (QUANTITY_UNITS.includes(second) && rest.length > 0) {
    return { quantity: { amount, unit: second }, name: rest.join(' ') };
  }

  return { quantity: { amount, unit: '' }, name: [second, ...rest].join(' ') };
}

function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
