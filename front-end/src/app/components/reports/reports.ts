import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Report {
  id: string;
  name: string;
  type: string;
  period: string;
  riskLevel: 'high' | 'medium' | 'low' | 'pending';
  dateGenerated: string;
  status: 'completed' | 'pending' | 'in-progress';
  selected?: boolean;
  filePath: string; // Path to the PDF file in assets
  fileSize: string;
}

interface NewReport {
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  name: string;
  notes: string;
  includeCharts: boolean;
  includeAI: boolean;
  emailCopy: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class Reports implements OnInit {
  Math = Math;
  
  // View state
  viewMode: 'table' | 'grid' = 'table';
  showGenerateModal = false;
  showViewModal = false;
  showDownloadProgress = false;
  isGenerating = false;
  downloadProgress = 0;
  
  // Filters
  filters = {
    startDate: '',
    endDate: '',
    reportType: 'all',
    status: 'all'
  };
  
  searchQuery = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  
  // Selected report for viewing
  selectedReport: Report | null = null;
  
  // New report data
  newReport: NewReport = {
    type: '',
    period: '',
    startDate: '',
    endDate: '',
    name: '',
    notes: '',
    includeCharts: true,
    includeAI: true,
    emailCopy: false
  };
  
  // Sample data - 5 reports as per your requirement
  reports: Report[] = [
    {
      id: '1',
      name: 'Payroll_Report_Nov_2025.pdf',
      type: 'Payroll',
      period: 'Nov 2025',
      riskLevel: 'low',
      dateGenerated: this.getTodayFormatted(),
      status: 'completed',
      filePath: 'assets/reports/payroll-report.pdf',
      fileSize: '2.4 MB'
    },
    {
      id: '2',
      name: 'VAT_Summary_Nov_2025.pdf',
      type: 'VAT',
      period: 'Nov 2025',
      riskLevel: 'medium',
      dateGenerated: this.getTodayFormatted(),
      status: 'completed',
      filePath: 'assets/reports/vat-summary-report.pdf',
      fileSize: '3.1 MB'
    },
    {
      id: '3',
      name: 'Income_Statement_Nov_2025.pdf',
      type: 'Income Statement',
      period: 'Nov 2025',
      riskLevel: 'low',
      dateGenerated: this.getTodayFormatted(),
      status: 'completed',
      filePath: 'assets/reports/income-statement-report.pdf',
      fileSize: '2.8 MB'
    },
    {
      id: '4',
      name: 'Bank_Statement_Nov_2025.pdf',
      type: 'Bank Statement',
      period: 'Nov 2025',
      riskLevel: 'low',
      dateGenerated: this.getTodayFormatted(),
      status: 'completed',
      filePath: 'assets/reports/bank-statement-report.pdf',
      fileSize: '3.5 MB'
    },
    {
      id: '5',
      name: 'Tax_Risk_Summary_Nov_2025.pdf',
      type: 'Tax Risk Summary',
      period: 'Nov 2025',
      riskLevel: 'medium',
      dateGenerated: this.getTodayFormatted(),
      status: 'completed',
      filePath: 'assets/reports/tax-risk-summary.pdf',
      fileSize: '4.2 MB'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Initialize date filters to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.filters.startDate = firstDay.toISOString().split('T')[0];
    this.filters.endDate = lastDay.toISOString().split('T')[0];
  }

  /**
   * Get today's date formatted
   */
  private getTodayFormatted(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  /**
   * Calculate summary stats dynamically
   */
  get totalReports(): number {
    return this.reports.length;
  }

  get reportsThisMonth(): number {
    const now = new Date();
    return this.reports.filter(report => {
      const reportDate = new Date(report.dateGenerated);
      return reportDate.getMonth() === now.getMonth() && 
             reportDate.getFullYear() === now.getFullYear();
    }).length;
  }

  get avgRiskLevel(): string {
    const riskLevels = this.reports.map(r => r.riskLevel);
    const highCount = riskLevels.filter(r => r === 'high').length;
    const mediumCount = riskLevels.filter(r => r === 'medium').length;
    const lowCount = riskLevels.filter(r => r === 'low').length;

    if (highCount > mediumCount && highCount > lowCount) return 'High';
    if (mediumCount > lowCount) return 'Moderate';
    return 'Low';
  }

  get lastGenerated(): string {
    if (this.reports.length === 0) return 'N/A';
    
    // Get the most recent report
    const sortedReports = [...this.reports].sort((a, b) => {
      return new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime();
    });
    
    const lastReport = sortedReports[0];
    const lastDate = new Date(lastReport.dateGenerated);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return lastReport.dateGenerated;
  }

  get filteredReports(): Report[] {
    return this.reports.filter(report => {
      const matchesType = this.filters.reportType === 'all' || 
        report.type.toLowerCase().includes(this.filters.reportType.toLowerCase());
      const matchesStatus = this.filters.status === 'all' || report.status === this.filters.status;
      const matchesSearch = this.searchQuery === '' || 
        report.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return matchesType && matchesStatus && matchesSearch;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReports.length / this.pageSize);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'fa-solid fa-circle-check';
      case 'pending': return 'fa-solid fa-clock';
      case 'in-progress': return 'fa-solid fa-spinner fa-spin';
      default: return 'fa-solid fa-circle';
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filteredReports.forEach(report => report.selected = checked);
  }

  openGenerateModal(): void {
    this.showGenerateModal = true;
  }

  closeGenerateModal(): void {
    this.showGenerateModal = false;
    this.resetNewReport();
  }

  generateReport(): void {
    if (!this.newReport.type || !this.newReport.period || !this.newReport.startDate || !this.newReport.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    this.isGenerating = true;
    
    // Simulate report generation
    setTimeout(() => {
      const newReport: Report = {
        id: (this.reports.length + 1).toString(),
        name: this.newReport.name || `Report_${new Date().getTime()}.pdf`,
        type: this.formatReportType(this.newReport.type),
        period: this.formatPeriod(this.newReport.period, this.newReport.startDate, this.newReport.endDate),
        riskLevel: 'pending',
        dateGenerated: this.getTodayFormatted(),
        status: 'in-progress',
        filePath: 'assets/reports/generated-report.pdf', // Placeholder
        fileSize: '2.5 MB'
      };
      
      this.reports.unshift(newReport);
      
      this.isGenerating = false;
      this.closeGenerateModal();
      
      // Simulate completion after 3 seconds
      setTimeout(() => {
        newReport.status = 'completed';
        newReport.riskLevel = 'low';
        alert(`Report "${newReport.name}" has been generated successfully!`);
      }, 3000);
    }, 2000);
  }

  formatReportType(type: string): string {
    const types: { [key: string]: string } = {
      'tax-risk': 'Tax Risk Summary',
      'vat': 'VAT',
      'payroll': 'Payroll',
      'comprehensive': 'Comprehensive',
      'bank-statement': 'Bank Statement',
      'income-statement': 'Income Statement'
    };
    return types[type] || type;
  }

  formatPeriod(period: string, start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (period === 'month') {
      return startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (period === 'quarter') {
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      return `Q${quarter} ${startDate.getFullYear()}`;
    } else if (period === 'year') {
      return `Year ${startDate.getFullYear()}`;
    }
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  resetNewReport(): void {
    this.newReport = {
      type: '',
      period: '',
      startDate: '',
      endDate: '',
      name: '',
      notes: '',
      includeCharts: true,
      includeAI: true,
      emailCopy: false
    };
  }

  viewReport(report: Report): void {
    this.selectedReport = report;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedReport = null;
  }

  /**
   * Download report - actual file download from assets
   */
  downloadReport(report: Report): void {
    this.showDownloadProgress = true;
    this.downloadProgress = 0;
    
    const interval = setInterval(() => {
      this.downloadProgress += 10;
      
      if (this.downloadProgress >= 100) {
        clearInterval(interval);
        
        // Trigger actual download
        this.triggerFileDownload(report.filePath, report.name);
        
        setTimeout(() => {
          this.showDownloadProgress = false;
          this.downloadProgress = 0;
        }, 500);
      }
    }, 200);
  }

  /**
   * Trigger actual file download from assets folder
   */
  private triggerFileDownload(filePath: string, fileName: string): void {
    // Create a link element
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    link.target = '_blank'; // Open in new tab if download fails
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`📥 Downloading: ${fileName} from ${filePath}`);
  }

  deleteReport(report: Report): void {
    if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
      const index = this.reports.findIndex(r => r.id === report.id);
      if (index > -1) {
        this.reports.splice(index, 1);
        alert(`Report "${report.name}" has been deleted.`);
      }
    }
  }

  regenerateReport(report: Report | null): void {
    if (!report) return;
    
    if (confirm(`Re-generate "${report.name}"?`)) {
      report.status = 'in-progress';
      report.riskLevel = 'pending';
      
      setTimeout(() => {
        report.status = 'completed';
        report.riskLevel = 'low';
        report.dateGenerated = this.getTodayFormatted();
        alert(`Report "${report.name}" has been regenerated successfully.`);
      }, 3000);
      
      this.closeViewModal();
    }
  }

  /**
   * Export all selected reports
   */
  exportAll(): void {
    const selectedReports = this.reports.filter(r => r.selected);
    
    if (selectedReports.length === 0) {
      alert('Please select at least one report to export');
      return;
    }
    
    this.showDownloadProgress = true;
    this.downloadProgress = 0;
    
    const interval = setInterval(() => {
      this.downloadProgress += 5;
      
      if (this.downloadProgress >= 100) {
        clearInterval(interval);
        
        // Download each selected report
        selectedReports.forEach(report => {
          this.triggerFileDownload(report.filePath, report.name);
        });
        
        setTimeout(() => {
          this.showDownloadProgress = false;
          this.downloadProgress = 0;
          alert(`Successfully exported ${selectedReports.length} report(s)`);
        }, 500);
      }
    }, 150);
  }

  refreshReports(): void {
    // In real app, this would fetch latest data from backend
    console.log('🔄 Refreshing reports...');
    alert('Reports refreshed successfully!');
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}