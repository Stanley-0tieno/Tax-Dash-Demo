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
      title: 'Turnover Risk',
      value: 'KSh 50.2M',
      trend: '12%',
      trendDirection: 'up',
      riskLabel: 'Moderate Variance',
      riskLevel: 'moderate',
      icon: 'fa-chart-column',
      color: 'amber'
    },
    {
      title: 'Payroll Consistency',
      value: 'KSh 12.8M',
      trend: '0%',
      trendDirection: 'stable',
      riskLabel: 'Stable',
      riskLevel: 'low',
      icon: 'fa-users',
      color: 'green'
    },
    {
      title: 'VAT Returns',
      value: 'KSh 4.5M',
      trend: '8%',
      trendDirection: 'down',
      riskLabel: 'Underreported',
      riskLevel: 'high',
      icon: 'fa-percent',
      color: 'red'
    },
    {
      title: 'VAT Refund Claims',
      value: 'KSh 1.2M',
      trend: '5%',
      trendDirection: 'up',
      riskLabel: 'Pending Validation',
      riskLevel: 'pending',
      icon: 'fa-receipt',
      color: 'gray'
    }
  ];

  private readonly mockInsights: InsightData[] = [
    {
      priority: 'critical',
      time: '2h ago',
      title: 'VAT Returns Discrepancy',
      description: 'VAT returns show an 18.7% underreporting compared to expected calculations based on declared turnover. This pattern has persisted for the last 3 months.',
      hasMetrics: false
    },
    {
      priority: 'warning',
      time: '3h ago',
      title: 'Turnover Mismatch Detected',
      description: 'Turnover shows a 12% variance between declared and recorded values for Q3. This could indicate timing differences or classification errors.',
      hasMetrics: false
    },
    {
      priority: 'info',
      time: '5h ago',
      title: 'Increased Refund Activity',
      description: 'VAT refund requests have risen by 8%, possibly due to input tax accumulation. This trend is normal for businesses with high capital expenditure.',
      hasMetrics: true
    }
  ];

  private readonly mockTableData: TableRow[] = [
    {
      metric: 'Turnover',
      icon: 'fa-chart-column',
      iconColor: '#FFA502',
      variance: '-12.4%',
      isPositive: false,
      risk: 'medium',
      timestamp: '2 hours ago'
    },
    {
      metric: 'Payroll',
      icon: 'fa-users',
      iconColor: '#00B894',
      variance: '+0.3%',
      isPositive: true,
      risk: 'low',
      timestamp: '1 hour ago'
    },
    {
      metric: 'VAT Returns',
      icon: 'fa-percent',
      iconColor: '#FF6B6B',
      variance: '-18.7%',
      isPositive: false,
      risk: 'high',
      timestamp: '3 hours ago'
    },
    {
      metric: 'VAT Refunds',
      icon: 'fa-receipt',
      iconColor: '#636E72',
      variance: '+8.2%',
      isPositive: true,
      risk: 'pending',
      timestamp: '30 mins ago'
    },
    {
      metric: 'Revenue Recognition',
      icon: 'fa-money-bill-trend-up',
      iconColor: '#6C5CE7',
      variance: '+2.1%',
      isPositive: true,
      risk: 'low',
      timestamp: '5 hours ago'
    },
    {
      metric: 'Expense Claims',
      icon: 'fa-file-invoice-dollar',
      iconColor: '#A29BFE',
      variance: '-5.6%',
      isPositive: false,
      risk: 'medium',
      timestamp: '4 hours ago'
    }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

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