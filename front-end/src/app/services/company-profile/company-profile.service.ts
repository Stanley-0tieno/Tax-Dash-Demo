import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginService } from '../auth/login-service';

export interface CompanyProfile {
  name: string;
  sector: string;
  kraPin: string;
  regNumber: string;
  email: string;
  phone: string;
  address: string;
  incorporationDate: string;
  employees: number;
  logo: string;
  complianceCert: boolean;
  bankDetails: boolean;
  profileCompletion: number;
}

export interface UpdateProfileRequest {
  company?: string;
  sector?: string;
  phone?: string;
  email?: string;
  address?: string;
  regNumber?: string;
  incorporationDate?: string;
  employees?: number;
  complianceCert?: boolean;
  bankDetails?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  profile?: T;
  logoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {
  private apiUrl = 'http://localhost:8084/profile';

  constructor(private http: HttpClient, private loginService: LoginService) { }

  getProfile(): Observable<CompanyProfile> {
    console.log('🔄 Fetching profile with token...');
    return this.http.get<CompanyProfile>(this.apiUrl, { headers: this.loginService.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error fetching profile:', error);
        return throwError(() => new Error('Failed to fetch profile. Please try again.'));
      })
    );
  }

  updateProfile(updateData: UpdateProfileRequest): Observable<ApiResponse<CompanyProfile>> {
    return this.http.put<ApiResponse<CompanyProfile>>(this.apiUrl, updateData, { headers: this.loginService.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error updating profile:', error);
        return throwError(() => new Error('Failed to update profile. Please try again.'));
      })
    );
  }

  uploadLogo(file: File): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);

    // ← Only pass Authorization header — NO Content-Type
    // Browser automatically sets multipart/form-data with correct boundary
    const token = this.loginService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/logo`, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error uploading logo:', error);
        const errorMessage = error.error?.message || 'Failed to upload logo. Please try again.';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  deleteLogo(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/logo`, { headers: this.loginService.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error deleting logo:', error);
        return throwError(() => new Error('Failed to delete logo. Please try again.'));
      })
    );
  }

  getProfileCompletion(): Observable<{ completion: number; hint: string }> {
    return this.http.get<{ completion: number; hint: string }>(`${this.apiUrl}/completion`, { headers: this.loginService.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error fetching profile completion:', error);
        return throwError(() => new Error('Failed to fetch completion status.'));
      })
    );
  }
}