import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, throwError, catchError, timeout } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message: string;
  userId?: string;
  email?: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  
  private readonly baseUrl = 'http://localhost:8085/api/auth';
  private readonly tokenKey = 'authToken';  
  private readonly userEmailKey = 'user_email';
  private readonly userIdKey = 'user_id';
  private readonly userNameKey = 'user_name';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuthenticationStatus();
  }

  login(loginData: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    console.log('Making login request for:', loginData.email);

    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      loginData,
      { headers, observe: 'body', responseType: 'json' }
    ).pipe(
      timeout(15000),
      tap((response: LoginResponse) => {
        if (response.success && response.token) {
          this.storeAuthData(
            response.token,
            loginData.email,
            response.userId,
            response.name
          );
          console.log('Login successful - userId stored:', response.userId);
        }
      }),
      catchError((error) => {
        console.error('Login request failed:', error);
        return throwError(() => error);
      })
    );
  }

  private storeAuthData(token: string, email: string, userId?: string, name?: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userEmailKey, email);
    
    if (userId) {
      localStorage.setItem(this.userIdKey, userId);
      console.log('UserId stored in localStorage:', userId);
    }
    
    if (name) {
      localStorage.setItem(this.userNameKey, name);
    }
    
    this.isAuthenticatedSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserEmail(): string | null {
    return localStorage.getItem(this.userEmailKey);
  }

  getUserId(): string | null {
    const storedUserId = localStorage.getItem(this.userIdKey);
    if (storedUserId) {
      return storedUserId;
    }
    console.warn('No userId found in localStorage');
    return null;
  }

  getUserName(): string | null {
    return localStorage.getItem(this.userNameKey);
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch (e) {
      return false;
    }
  }

  private checkAuthenticationStatus(): void {
    const hasToken = this.hasValidToken();
    this.isAuthenticatedSubject.next(hasToken);
    
    if (!hasToken && this.getToken()) {
      this.clearAuthState();
    }
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userEmailKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.userNameKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/log-in']);
    console.log('User logged out successfully');
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  clearAuthState(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userEmailKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.userNameKey);
    this.isAuthenticatedSubject.next(false);
  }

  getAuthState(): { isAuthenticated: boolean; email: string | null; userId: string | null; hasToken: boolean } {
    return {
      isAuthenticated: this.isAuthenticated(),
      email: this.getUserEmail(),
      userId: this.getUserId(),
      hasToken: !!this.getToken()
    };
  }
}