import type { Route } from '@angular/router';
import { ShoppingList } from './shopping-list.ng';
import { shoppingListRouterHelper } from './shopping-list.router-helper';

export const shoppingListRoutes: Route[] = [
  {
    path: shoppingListRouterHelper.PATH,
    component: ShoppingList,
  },
];
