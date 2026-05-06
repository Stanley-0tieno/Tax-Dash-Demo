import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface MetricData {
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'stable';
  riskLabel: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'pending';
  icon: string;
  color: 'amber' | 'green' | 'red' | 'gray';
}

interface InsightData {
  priority: 'critical' | 'warning' | 'info';
  time: string;
  title: string;
  description: string;
  hasMetrics?: boolean;
}

interface TableRow {
  metric: string;
  icon: string;
  iconColor: string;
  variance: string;
  isPositive: boolean;
  risk: 'high' | 'medium' | 'low' | 'pending';
  timestamp: string;
}

@Component({
  selector: 'app-risk-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-analysis.html',
  styleUrls: ['./risk-analysis.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class RiskAnalysis implements OnInit, AfterViewInit, OnDestroy {
  // State management
  isAnalyzing = false;
  analysisComplete = false;
  currentStep = '';
  progressPercent = 0;
  showCharts = false;
  showSparkline = false;

  // Data
  metrics: MetricData[] = [];
  insights: InsightData[] = [];
  tableData: TableRow[] = [];

  // Charts - PUBLIC so they can be accessed in template
  riskTrendChart: Chart | null = null;
  sparklineChart: Chart | null = null;

  // Keep progress interval private as it's not used in template
  private progressInterval: any;

  // Mock data
  private readonly mockMetrics: MetricData[] = [
    {
      title: 'October Invoice',
      value: 'KSh 7.20M',
      trend: '100%',
      trendDirection: 'up',
      riskLabel: 'Safaricom PLC',
      riskLevel: 'low',
      icon: 'fa-file-invoice-dollar',
      color: 'green'
    },
    {
      title: 'Gross Payroll',
      value: 'KSh 3.87M',
      trend: '54%',
      trendDirection: 'stable',
      riskLabel: 'High PR-to-Rev Ratio',
      riskLevel: 'high',
      icon: 'fa-users',
      color: 'red'
    },
    {
      title: 'VAT Obligation',
      value: 'KSh 993K',
      trend: '16%',
      trendDirection: 'down',
      riskLabel: 'Not Fully Remitted',
      riskLevel: 'moderate',
      icon: 'fa-percent',
      color: 'amber'
    },
    {
      title: 'Closing Balance',
      value: '-KSh 5.80M',
      trend: 'Insolvent',
      trendDirection: 'down',
      riskLabel: 'Cash flow stress',
      riskLevel: 'high',
      icon: 'fa-building-columns',
      color: 'red'
    }
  ];

  private readonly mockInsights: InsightData[] = [
    {
      priority: 'critical',
      time: '1h ago',
      title: 'Cash Flow Insolvency',
      description: 'Bank overdraft of approx. KSh 5.8M by end of month 4 — company is technically insolvent on cash basis. Payroll for 50 employees is being disbursed without matching revenue inflows in Q3–Q4.',
      hasMetrics: false
    },
    {
      priority: 'warning',
      time: '2h ago',
      title: 'PAYE Regularity Discrepancy',
      description: 'PAYE remitted each month but figures are below the October payroll register total of KSh 781K. Reconcile to avoid KRA penalties.',
      hasMetrics: true
    },
    {
      priority: 'warning',
      time: '4h ago',
      title: 'VAT Compliance Risk',
      description: 'VAT collections from the KSh 7.2M Safaricom invoice (KSh 993K) not yet fully visible in remittance records. 3 VAT payments recorded against the obligation.',
      hasMetrics: false
    },
    {
      priority: 'info',
      time: '5h ago',
      title: 'NSSF, NHIF & Housing Levy Compliant',
      description: 'NHIF (KSh 60K/month), NSSF, and Affordable Housing Levy payments recorded in all 3 months, aligning perfectly with the payroll register.',
      hasMetrics: false
    }
  ];

  private readonly mockTableData: TableRow[] = [
    {
      metric: 'Cash Flow Stress',
      icon: 'fa-building-columns',
      iconColor: '#FF6B6B',
      variance: '-8.0M',
      isPositive: false,
      risk: 'high',
      timestamp: 'Today'
    },
    {
      metric: 'Payroll-to-Revenue',
      icon: 'fa-chart-pie',
      iconColor: '#FF6B6B',
      variance: '54%',
      isPositive: false,
      risk: 'high',
      timestamp: 'Today'
    },
    {
      metric: 'VAT Compliance',
      icon: 'fa-receipt',
      iconColor: '#FFA502',
      variance: 'Pending',
      isPositive: true,
      risk: 'medium',
      timestamp: '2 hrs ago'
    },
    {
      metric: 'PAYE Regularity',
      icon: 'fa-money-bill-transfer',
      iconColor: '#FFA502',
      variance: 'Underpaid',
      isPositive: false,
      risk: 'medium',
      timestamp: '3 hrs ago'
    },
    {
      metric: 'NSSF/NHIF',
      icon: 'fa-shield-halved',
      iconColor: '#00B894',
      variance: 'Compliant',
      isPositive: true,
      risk: 'low',
      timestamp: '1 day ago'
    },
    {
      metric: 'Housing Levy',
      icon: 'fa-house-chimney-user',
      iconColor: '#00B894',
      variance: 'Compliant',
      isPositive: true,
      risk: 'low',
      timestamp: '1 day ago'
    }
  ];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    console.log('🎯 Risk Analysis initialized - ready for demo');
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after analysis
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  /**
   * Start the analysis simulation (triggered by button click)
   */
  async startAnalysis(): Promise<void> {
    if (this.isAnalyzing || this.analysisComplete) return;

    console.log('🚀 Starting ML analysis simulation...');
    this.isAnalyzing = true;
    this.progressPercent = 0;

    // Reset data
    this.metrics = [];
    this.tableData = [];
    this.insights = [];
    this.showCharts = false;
    this.showSparkline = false;

    // Simulate progress bar
    this.startProgressBar();

    // Step 1: Processing documents (2s)
    this.currentStep = 'Processing uploaded documents...';
    await this.delay(2000);

    // Step 2: Extracting data (2s)
    this.currentStep = 'Extracting financial data...';
    await this.delay(2000);

    // Step 3: Running ML models (2.5s)
    this.currentStep = 'Running risk analysis models...';
    await this.delay(2500);

    // Step 4: Generating insights (2.5s)
    this.currentStep = 'Generating AI insights...';
    await this.delay(2500);

    // Complete progress
    this.progressPercent = 100;
    this.cdr.detectChanges();
    await this.delay(500);

    // Clear progress interval
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Complete - Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.isAnalyzing = false;
      this.analysisComplete = true;
      this.currentStep = '';
      this.cdr.detectChanges();

      // Reveal data progressively
      this.revealData();
    }, 100);

    console.log('✅ Analysis complete - ready to reveal data!');
  }

  /**
   * Simulate progress bar
   */
  private startProgressBar(): void {
    const totalDuration = 9500; // 9.5 seconds total
    const intervalTime = 100; // Update every 100ms
    const increment = (100 / totalDuration) * intervalTime;

    this.progressInterval = setInterval(() => {
      if (this.progressPercent < 95) {
        this.progressPercent += increment;
        this.cdr.detectChanges(); // Force change detection
      }
    }, intervalTime);
  }

  /**
   * Progressively reveal data with smooth animations
   */
  private async revealData(): Promise<void> {
    console.log('📊 Starting data reveal...');

    // Show metrics one by one with delay
    for (let i = 0; i < this.mockMetrics.length; i++) {
      await this.delay(400);
      this.metrics = [...this.metrics, this.mockMetrics[i]];
      this.cdr.detectChanges();
    }
    console.log('✅ Metrics revealed');

    // Wait before showing charts
    await this.delay(600);
    this.showCharts = true;
    this.cdr.detectChanges();
    console.log('📈 Chart section visible, waiting for DOM...');

    // Wait longer for DOM to fully render the canvas
    await this.delay(300);

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      this.initRiskTrendChart();
    });

    // Wait a bit
    await this.delay(500);

    // Show table data
    for (let i = 0; i < this.mockTableData.length; i++) {
      await this.delay(200);
      this.tableData = [...this.tableData, this.mockTableData[i]];
      this.cdr.detectChanges();
    }
    console.log('✅ Table data revealed');

    // Wait before insights
    await this.delay(400);

    // Show insights one by one
    for (let i = 0; i < this.mockInsights.length; i++) {
      await this.delay(500);
      this.insights = [...this.insights, this.mockInsights[i]];
      this.cdr.detectChanges();
    }
    console.log('✅ Insights revealed');

    // Initialize sparkline last
    await this.delay(300);
    this.showSparkline = true;
    this.cdr.detectChanges();
    console.log('📊 Sparkline section visible, waiting for DOM...');

    await this.delay(200);

    // Use requestAnimationFrame for sparkline too
    requestAnimationFrame(() => {
      this.initSparklineChart();
    });
  }

  private initRiskTrendChart(): void {
    const canvas = document.getElementById('riskTrendChart') as HTMLCanvasElement;
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      console.warn('Risk trend chart canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get canvas context');
      return;
    }

    // Destroy existing chart if any
    if (this.riskTrendChart) {
      this.riskTrendChart.destroy();
    }

    this.riskTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Turnover',
            data: [45, 52, 48, 65, 68, 72, 70, 68, 65, 62, 58, 55],
            borderColor: '#FFA502',
            backgroundColor: 'rgba(255, 165, 2, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#FFA502',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Payroll',
            data: [20, 22, 21, 23, 24, 25, 24, 23, 22, 21, 20, 19],
            borderColor: '#00B894',
            backgroundColor: 'rgba(0, 184, 148, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#00B894',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'VAT',
            data: [55, 58, 62, 68, 75, 78, 82, 85, 88, 86, 83, 80],
            borderColor: '#FF6B6B',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#FF6B6B',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Refunds',
            data: [30, 32, 35, 38, 42, 45, 48, 50, 52, 54, 56, 58],
            borderColor: '#6C5CE7',
            backgroundColor: 'rgba(108, 92, 231, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#6C5CE7',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(45, 52, 54, 0.95)',
            padding: 12,
            borderColor: '#E8EBF0',
            borderWidth: 1,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            displayColors: true,
            boxPadding: 6
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: '500' as any }, color: '#636E72' }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#F8F9FC', lineWidth: 1 },
            ticks: { font: { size: 12, weight: '500' as any }, color: '#636E72' }
          }
        }
      }
    });

    console.log('✅ Risk trend chart initialized');
  }

  private initSparklineChart(): void {
    const canvas = document.getElementById('sparklineChart') as HTMLCanvasElement;
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      console.warn('Sparkline chart canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get sparkline canvas context');
      return;
    }

    // Destroy existing chart if any
    if (this.sparklineChart) {
      this.sparklineChart.destroy();
    }

    this.sparklineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Risk Score',
          data: [65, 68, 62, 70, 68, 65, 62],
          borderColor: '#6C5CE7',
          backgroundColor: 'rgba(108, 92, 231, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#6C5CE7',
          pointBorderColor: '#fff',
          pointBorderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1500, easing: 'easeInOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(45, 52, 54, 0.95)',
            padding: 8,
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            displayColors: false
          }
        },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true, max: 100 }
        }
      }
    });

    console.log('✅ Sparkline chart initialized');
  }

  private destroyCharts(): void {
    if (this.riskTrendChart) {
      this.riskTrendChart.destroy();
      this.riskTrendChart = null;
    }
    if (this.sparklineChart) {
      this.sparklineChart.destroy();
      this.sparklineChart = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}