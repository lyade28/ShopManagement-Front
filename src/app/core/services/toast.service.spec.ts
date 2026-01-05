import { TestBed } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show a success toast', (done) => {
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0 && toasts[0].type === 'success') {
        expect(toasts[0].message).toBe('Test success');
        expect(toasts[0].type).toBe('success');
        done();
      }
    });
    
    service.success('Test success');
  });

  it('should show an error toast', (done) => {
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0 && toasts[0].type === 'error') {
        expect(toasts[0].message).toBe('Test error');
        expect(toasts[0].type).toBe('error');
        done();
      }
    });
    
    service.error('Test error');
  });

  it('should dismiss a toast', (done) => {
    let toastId: string;
    
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0 && !toastId) {
        toastId = toasts[0].id;
        service.dismiss(toastId);
      } else if (toasts.length === 0 && toastId) {
        expect(toasts.length).toBe(0);
        done();
      }
    });
    
    service.info('Test info');
  });

  it('should clear all toasts', (done) => {
    service.success('Test 1');
    service.error('Test 2');
    
    setTimeout(() => {
      service.clear();
      service.toasts$.subscribe(toasts => {
        expect(toasts.length).toBe(0);
        done();
      });
    }, 100);
  });
});

