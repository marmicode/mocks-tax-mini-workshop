export const shoppingListRouterHelper = {
  PATH: 'shopping-list' as const,

  shoppingList() {
    return ['/', this.PATH];
  },
};
