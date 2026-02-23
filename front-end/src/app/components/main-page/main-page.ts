import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DashboardData {
  riskScore: number;
  riskLabel: string;
  compliancePercentage: number;
  totalRisk: number;
  documents: {
    bankStatements: number;
    payroll: number;
    incomeStatements: number;
    taxCertificates: number;
    vatReports: number;
  };
  anomalies: AnomalyItem[];
  hasAnalysis: boolean;
}

interface AnomalyItem {
  type: string;
  title: string;
  subtitle: string;
  value: string;
  icon: string;
  color: 'pink' | 'green' | 'gray';
}

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.scss']
})
export class MainPage implements OnInit, AfterViewInit, OnDestroy {
  
  // State flag - determines if user has completed analysis
  hasAnalysisData = false;
  
  // Dashboard data with default empty values
  dashboardData: DashboardData = {
    riskScore: 0,
    riskLabel: 'No Analysis',
    compliancePercentage: 0,
    totalRisk: 0,
    documents: {
      bankStatements: 0,
      payroll: 0,
      incomeStatements: 0,
      taxCertificates: 0,
      vatReports:0
    },
    anomalies: [],
    hasAnalysis: false
  };

  // Mock data for after analysis (you'll replace this with real API data)
  private mockAnalysisData: DashboardData = {
    riskScore: 28,
    riskLabel: 'Moderate Risk',
    compliancePercentage: 87,
    totalRisk: 15,
    documents: {
      bankStatements: 12,
      payroll: 4,
      incomeStatements: 4,
      taxCertificates: 3,
      vatReports: 4
    },
    anomalies: [
      {
        type: 'error',
        title: 'Missing VAT entry',
        subtitle: 'Invoice #104',
        value: 'Ksh 511,001.50',
        icon: 'fa-circle-exclamation',
        color: 'pink'
      },
      {
        type: 'warning',
        title: 'Inconsistent Income data',
        subtitle: 'Q3 Report',
        value: 'April 15',
        icon: 'fa-chart-line',
        color: 'green'
      }

    ],
    hasAnalysis: true
  };

  // Charts
  private complianceChart: Chart | null = null;
  private trendChart: Chart | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('📊 Dashboard initialized');
    
    // Check if we have analysis data from previous navigation
    this.checkForAnalysisData();
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      if (this.hasAnalysisData) {
        this.initializeCharts();
      } else {
        this.initializeEmptyCharts();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  /**
   * Check if analysis data exists in sessionStorage or state
   */
  private checkForAnalysisData(): void {
    // Check sessionStorage for analysis completion
    const analysisComplete = sessionStorage.getItem('analysisComplete');
    const analysisData = sessionStorage.getItem('analysisData');

    if (analysisComplete === 'true' && analysisData) {
      // Parse and load the analysis data
      try {
        this.dashboardData = JSON.parse(analysisData);
        this.hasAnalysisData = true;
        console.log('✅ Analysis data loaded from storage');
      } catch (error) {
        console.error('Error parsing analysis data:', error);
        this.loadDefaultState();
      }
    } else {
      // First time user - show empty state
      this.loadDefaultState();
      console.log('👋 New user - showing empty dashboard');
    }
  }

  /**
   * Load default empty state
   */
  private loadDefaultState(): void {
    this.hasAnalysisData = false;
    this.dashboardData = {
      riskScore: 0,
      riskLabel: 'No Analysis',
      compliancePercentage: 0,
      totalRisk: 0,
      documents: {
        bankStatements: 0,
        payroll: 0,
        incomeStatements: 0,
        taxCertificates: 0,
        vatReports: 0
      },
      anomalies: [],
      hasAnalysis: false
    };
  }

  /**
   * Navigate to file upload page to start analysis
   */
  startAnalysis(): void {
    this.router.navigate(['/file-upload']);
  }

  /**
   * Navigate to risk analysis page (if already completed)
   */
  viewFullAnalysis(): void {
    if (this.hasAnalysisData) {
      this.router.navigate(['/risk-analysis']);
    }
  }

  /**
   * Initialize charts with real data
   */
  private initializeCharts(): void {
    this.initComplianceChart();
    this.initTrendChart();
  }

  /**
   * Initialize charts with empty/placeholder data
   */
  private initializeEmptyCharts(): void {
    this.initComplianceChartEmpty();
    this.initTrendChartEmpty();
  }
  
  /**
   * Compliance Chart (with data)
   */
  private initComplianceChart(): void {
    const canvas = document.getElementById('complianceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.complianceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['2015', '2016', '2017', '2018', '2019', '2020'],
        datasets: [{
          label: 'Compliance Score',
          data: [65, 72, 78, 75, 85, 92],
          borderColor: '#6C5CE7',
          backgroundColor: 'rgba(108, 92, 231, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#6C5CE7',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(45, 52, 54, 0.95)',
            padding: 10,
            titleFont: { size: 12 },
            bodyFont: { size: 11 }
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            ticks: { color: '#636E72', font: { size: 11 } }
          },
          y: { 
            display: false,
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  /**
   * Compliance Chart (empty state)
   */
  private initComplianceChartEmpty(): void {
    const canvas = document.getElementById('complianceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.complianceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['2015', '2016', '2017', '2018', '2019', '2020'],
        datasets: [{
          label: 'No Data',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: '#E8EBF0',
          backgroundColor: 'rgba(232, 235, 240, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { 
            grid: { display: false },
            ticks: { color: '#B2BEC3', font: { size: 11 } }
          },
          y: { 
            display: false,
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  /**
   * Trend Chart (with data)
   */
  private initTrendChart(): void {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Risk Trend',
          data: [25, 20, 18, 15, 12, 10, 15],
          borderColor: '#FD79A8',
          backgroundColor: 'rgba(253, 121, 168, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true }
        }
      }
    });
  }

  /**
   * Trend Chart (empty state)
   */
  private initTrendChartEmpty(): void {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'No Data',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#E8EBF0',
          backgroundColor: 'rgba(232, 235, 240, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true }
        }
      }
    });
  }

  /**
   * Destroy charts on component destroy
   */
  private destroyCharts(): void {
    if (this.complianceChart) {
      this.complianceChart.destroy();
      this.complianceChart = null;
    }
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }
  }

  /**
   * DEMO ONLY: Simulate loading analysis data
   * Remove this in production - data should come from API
   */
  loadDemoData(): void {
    this.dashboardData = this.mockAnalysisData;
    this.hasAnalysisData = true;
    
    // Store in sessionStorage
    sessionStorage.setItem('analysisComplete', 'true');
    sessionStorage.setItem('analysisData', JSON.stringify(this.mockAnalysisData));
    
    // Reinitialize charts with data
    this.destroyCharts();
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
    
    console.log('✅ Demo data loaded');
  }

  /**
   * Clear analysis data (logout or reset)
   */
  clearAnalysisData(): void {
    sessionStorage.removeItem('analysisComplete');
    sessionStorage.removeItem('analysisData');
    this.loadDefaultState();
    
    // Reinitialize empty charts
    this.destroyCharts();
    setTimeout(() => {
      this.initializeEmptyCharts();
    }, 100);
    
    console.log('🗑️ Analysis data cleared');
  }
}