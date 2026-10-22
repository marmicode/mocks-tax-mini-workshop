import type { Route } from '@angular/router';
import { AdminCourseBoard } from './admin-course-board.ng';
import { AdminDuplicates } from './admin-duplicates.ng';
import { AdminExport } from './admin-export.ng';
import { AdminImport } from './admin-import.ng';
import { AdminIngredients } from './admin-ingredients.ng';
import { AdminQualityReport } from './admin-quality-report.ng';

/**
 * Relative to the admin route.
 */
export const adminCatalogRoutes: Route[] = [
  { path: 'catalog/duplicates', component: AdminDuplicates },
  { path: 'catalog/quality', component: AdminQualityReport },
  { path: 'catalog/courses', component: AdminCourseBoard },
  { path: 'catalog/ingredients', component: AdminIngredients },
  { path: 'catalog/export', component: AdminExport },
  { path: 'catalog/import', component: AdminImport },
];
