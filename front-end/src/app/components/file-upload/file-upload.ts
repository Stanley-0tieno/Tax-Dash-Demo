import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { FileUploadService, ExtractedData } from '../../services/file-upload/file-upload.service';

interface UploadedFile {
  id?: number;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'pending' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  uploadTime?: string;
  file?: File;
  extractedData?: ExtractedData;
  errorMessage?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [FileUploadService],
  templateUrl: './file-upload.html',
  styleUrls: ['./file-upload.scss']
})
export class FileUpLoad implements OnInit {
  uploadedFiles: UploadedFile[] = [];
  isDragging = false;
  allowedFormats = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
  maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  
  isAnalyzing = false;
  showAnalysisCard = false;
  analysisComplete = false;

  constructor(
    private fileUploadService: FileUploadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // IMPORTANT: Load files immediately on component init
    this.loadUploadedFiles();
  }

  loadUploadedFiles(): void {
    console.log('Loading uploaded files...');
    this.fileUploadService.getAllFiles().subscribe({
      next: (response) => {
        console.log('Files loaded:', response.files);
        this.uploadedFiles = response.files.map(f => ({
          id: f.id,
          name: f.filename,
          size: f.file_size,
          type: f.file_type,
          status: f.status as any,
          progress: f.status === 'completed' ? 100 : f.status === 'analyzing' ? 50 : 0,
          uploadTime: new Date(f.upload_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          extractedData: f.extracted_data || undefined,
          errorMessage: f.error_message || undefined
        }));
      },
      error: (error) => {
        console.error('Error loading files:', error);
        alert('Failed to load files from database');
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
      input.value = '';
    }
  }

  handleFiles(files: FileList): void {
    Array.from(files).forEach(file => {
      if (!this.validateFile(file)) {
        return;
      }

      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
        file: file
      };

      this.uploadedFiles.unshift(uploadedFile);
      this.uploadToBackend(uploadedFile);
    });
  }

  validateFile(file: File): boolean {
    if (file.size > this.maxFileSize) {
      alert(`File "${file.name}" exceeds maximum size of 10MB`);
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedFormats.includes(fileExtension)) {
      alert(`File format "${fileExtension}" is not allowed. Please upload: ${this.allowedFormats.join(', ')}`);
      return false;
    }

    return true;
  }

  uploadToBackend(uploadedFile: UploadedFile): void {
    if (!uploadedFile.file) return;

    this.fileUploadService.uploadFile(uploadedFile.file).subscribe({
      next: (event) => {
        if (event.progress !== undefined) {
          uploadedFile.progress = event.progress;
        }

        if (event.response) {
          uploadedFile.id = event.response.id;
          uploadedFile.status = 'pending'; // File uploaded but not analyzed yet
          uploadedFile.uploadTime = new Date(event.response.upload_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
          uploadedFile.progress = 0; // Reset progress for pending state
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        uploadedFile.status = 'failed';
        uploadedFile.errorMessage = error.message || 'Upload failed';
      }
    });
  }

  /**
   * NEW: Analyze all pending files
   */
  analyzeAllFiles(): void {
    const pendingCount = this.getPendingCount();
    
    if (pendingCount === 0) {
      alert('No pending files to analyze. Please upload files first.');
      return;
    }

    if (!confirm(`Analyze ${pendingCount} pending file(s)?`)) {
      return;
    }

    this.isAnalyzing = true;
    this.showAnalysisCard = false;
    this.analysisComplete = false;

    // Update UI to show analyzing status
    this.uploadedFiles
      .filter(f => f.status === 'pending')
      .forEach(f => {
        f.status = 'analyzing';
        f.progress = 50;
      });

    // Call backend to analyze all
    this.fileUploadService.analyzeAllFiles().subscribe({
      next: (response) => {
        console.log('Analysis complete:', response);
        
        // Reload files to get updated statuses
        this.loadUploadedFiles();
        
        this.isAnalyzing = false;
        this.analysisComplete = true;
        this.showAnalysisCard = true;

        // Auto-hide card after 10 seconds
        setTimeout(() => {
          this.showAnalysisCard = false;
        }, 10000);
      },
      error: (error) => {
        console.error('Analysis failed:', error);
        this.isAnalyzing = false;
        alert('Analysis failed: ' + (error.message || 'Unknown error'));
        
        // Reset analyzing files to pending
        this.uploadedFiles
          .filter(f => f.status === 'analyzing')
          .forEach(f => {
            f.status = 'pending';
            f.progress = 0;
          });
      }
    });
  }

  /**
   * Navigate to risk analysis page
   */
  goToRiskAnalysis(): void {
    this.router.navigate(['/risk-analysis']);
  }

  /**
   * Close analysis card
   */
  closeAnalysisCard(): void {
    this.showAnalysisCard = false;
  }

  retryUpload(file: UploadedFile): void {
    if (!file.file) {
      alert('Original file not available for retry');
      return;
    }
    
    file.status = 'uploading';
    file.progress = 0;
    file.errorMessage = undefined;
    this.uploadToBackend(file);
  }

  deleteFile(index: number): void {
    const file = this.uploadedFiles[index];
    
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    if (file.id) {
      this.fileUploadService.deleteFile(file.id).subscribe({
        next: () => {
          this.uploadedFiles.splice(index, 1);
        },
        error: (error) => {
          console.error('Delete failed:', error);
          alert('Failed to delete file from server');
        }
      });
    } else {
      this.uploadedFiles.splice(index, 1);
    }
  }

  viewFile(file: UploadedFile): void {
    if (file.extractedData) {
      const data = JSON.stringify(file.extractedData, null, 2);
      alert(`Extracted Data:\n\n${data}`);
    } else {
      alert('No extracted data available. Please analyze the file first.');
    }
  }

  downloadFile(file: UploadedFile): void {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert('File not available for download');
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'fa-solid fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-solid fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-solid fa-file-excel';
      case 'csv':
        return 'fa-solid fa-file-csv';
      default:
        return 'fa-solid fa-file';
    }
  }

  getFileIconClass(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'pdf-icon';
      case 'doc':
      case 'docx':
        return 'word-icon';
      case 'xls':
      case 'xlsx':
        return 'excel-icon';
      case 'csv':
        return 'csv-icon';
      default:
        return 'default-icon';
    }
  }

  getCompletedCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'completed').length;
  }

  getPendingCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'pending').length;
  }

  getAnalyzingCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'analyzing').length;
  }

  getFailedCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'failed').length;
  }
}