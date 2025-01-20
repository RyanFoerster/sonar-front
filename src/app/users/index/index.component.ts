import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [HlmButtonDirective, RouterLink],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent implements OnInit {
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  constructor() {
    if (this.authService.getUser()) {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit() {
    window.addEventListener('message', (event) => {
      if (event.origin === 'https://sonarartists.com') {
        if (event.data === 'login') {
          window.location.href = 'https://sonarartists.be';
        } else if (event.data === 'register') {
          window.location.href = 'https://sonarartists.be/register';
        }
      }
    });
  }
}
