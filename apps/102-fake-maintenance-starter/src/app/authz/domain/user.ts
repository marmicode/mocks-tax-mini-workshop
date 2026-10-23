import { computed, inject, Injectable, signal } from '@angular/core';
import { type User as UserProfile } from '@whiskmate/authz/model';
import { LocalStorage } from '@whiskmate/shared/infra';

const USER_STORAGE_KEY = 'whiskmate:user';

@Injectable({ providedIn: 'root' })
export class CurrentUser {
  private _localStorage = inject(LocalStorage);
  private _user = signal<UserProfile | null>(this._loadUser());

  user = this._user.asReadonly();

  isAdmin = computed(() => {
    const roles = this._user()?.roles ?? [];
    return roles.includes('admin');
  });

  /**
   * There is no real authentication: signing in just grants the admin role.
   */
  signInAsAdmin(): void {
    this._setUser({ roles: ['admin'] });
  }

  signOut(): void {
    this._setUser(null);
  }

  private _setUser(user: UserProfile | null): void {
    this._user.set(user);
    this._localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private _loadUser(): UserProfile | null {
    const storedValue = this._localStorage.getItem(USER_STORAGE_KEY);

    if (storedValue == null) {
      return null;
    }

    try {
      return JSON.parse(storedValue) as UserProfile;
    } catch {
      return null;
    }
  }
}
