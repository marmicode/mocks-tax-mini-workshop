export type UtmMedium = 'navbar' | 'sidebar' | 'footer' | 'banner' | 'page';

export const FEEDBACK_FORM_URL = 'https://forms.gle/febepTFEtyn1jj7RA';

export const WORKSHOP_URL = 'https://ai-poland.pl/workshop/from-drift-to-trust';
export const COURSE_URL =
  'https://courses.marmicode.io/courses/pragmatic-angular-testing?coupon=ngzurek';
export const TEAM_WORKSHOPS_URL = 'https://marmicode.io/workshops';
export const COACHING_URL = 'https://marmicode.io/coaching';
export const CONTACT_URL = 'https://forms.gle/EAUNbXtXQFCapQCd8';

/** Appends UTM parameters to external URLs, keeping existing query params. */
export function withUtm(url: string, medium: UtmMedium): string {
  if (!url.startsWith('http')) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=mocks-tax&utm_medium=${medium}&utm_campaign=ngpoland-webinar`;
}
