import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyProfileService, CompanyProfile, ApiResponse } from '../../services/company-profile/company-profile.service';

interface CompanyData {
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

interface FinancialData {
  turnover: string;
  netIncome: string;
  payroll: string;
  vat: string;
}

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-profile.html',
  styleUrls: ['./company-profile.scss']
})
export class CompanyProfileComponent implements OnInit {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;

  companyData: CompanyData = {
    name: '',
    sector: '',
    kraPin: '',
    regNumber: '',
    email: '',
    phone: '',
    address: '',
    incorporationDate: '',
    employees: 0,
    logo: '',
    complianceCert: false,
    bankDetails: false,
    profileCompletion: 0
  };

  financialData: FinancialData = {
    turnover: 'KES 0',
    netIncome: 'KES 0',
    payroll: 'KES 0',
    vat: 'KES 0'
  };

  profileCompletion: number = 0;
  showEditModal: boolean = false;
  editData: any = {};
  selectedPeriod: string = 'Annual';
  periods: string[] = ['Monthly', 'Quarterly', 'Annual'];

  constructor(
    private profileService: CompanyProfileService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.profileService.getProfile().subscribe({
      next: (profile: CompanyProfile) => {
        this.companyData = {
          name: profile.name,
          sector: profile.sector,
          kraPin: profile.kraPin,
          regNumber: profile.regNumber,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          incorporationDate: profile.incorporationDate,
          employees: profile.employees,
          logo: profile.logo,
          complianceCert: profile.complianceCert,
          bankDetails: profile.bankDetails,
          profileCompletion: profile.profileCompletion
        };
        this.profileCompletion = profile.profileCompletion;
      },
      error: (error: any) => {
        console.error('Error loading profile:', error);
      }
    });
  }

  editProfile() {
    this.editData = { ...this.companyData };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editData = {};
  }

  saveProfile() {
    this.profileService.updateProfile(this.editData).subscribe({
      next: (response: ApiResponse<CompanyProfile>) => {
        if (response.success && response.profile) {
          this.companyData = {
            name: response.profile.name,
            sector: response.profile.sector,
            kraPin: response.profile.kraPin,
            regNumber: response.profile.regNumber,
            email: response.profile.email,
            phone: response.profile.phone,
            address: response.profile.address,
            incorporationDate: response.profile.incorporationDate,
            employees: response.profile.employees,
            logo: response.profile.logo,
            complianceCert: response.profile.complianceCert,
            bankDetails: response.profile.bankDetails,
            profileCompletion: response.profile.profileCompletion
          };
          this.profileCompletion = response.profile.profileCompletion;
        }
        this.closeEditModal();
      },
      error: (error: any) => {
        console.error('Error saving profile:', error);
      }
    });
  }

  uploadLogo() {
    this.logoInput.nativeElement.click();
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profileService.uploadLogo(file).subscribe({
        next: (response: ApiResponse<string>) => {
          if (response.success && response.logoUrl) {
            this.companyData.logo = response.logoUrl;
          }
        },
        error: (error: any) => {
          console.error('Error uploading logo:', error);
        }
      });
    }
  }

  getCompletionHint(): string {
    if (!this.companyData.logo) return 'Upload your company logo';
    if (!this.companyData.complianceCert) return 'Upload compliance certificate';
    if (!this.companyData.bankDetails) return 'Add bank details';
    return 'Complete remaining fields';
  }

  completeProfile() {
    this.editProfile();
  }

  requestAuditorReport() {
    console.log('Request auditor report');
  }

  contactSupport() {
    console.log('Contact support');
  }

  downloadCertificate() {
    console.log('Download certificate');
  }

  logout() {
    this.router.navigate(['/log-in']);
  }
}

// Export as CompanyProfile for the router
export { CompanyProfileComponent as CompanyProfile };