import { inject } from '@angular/core';
import { CanActivateFn ,Router} from '@angular/router';

import { AuthService } from './auth.service'; 

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getIsLoggedIn()) {
    return true; // Allow access if the user is logged in
  } else {
    router.navigate(['/login']); // Redirect to the login page if the user is not logged in
    return false; // Prevent access if not logged in
  }
};
