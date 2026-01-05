import { TestBed } from '@angular/core/testing';
import { OfflineService, OfflineSale } from './offline.service';
import { SaleService } from './sale.service';
import { InventoryService } from './inventory.service';
import { ProductService } from './product.service';

describe('OfflineService', () => {
  let service: OfflineService;
  let saleServiceSpy: jasmine.SpyObj<SaleService>;
  let inventoryServiceSpy: jasmine.SpyObj<InventoryService>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;

  beforeEach(() => {
    const saleSpy = jasmine.createSpyObj('SaleService', ['createSale']);
    const inventorySpy = jasmine.createSpyObj('InventoryService', ['getInventoriesList']);
    const productSpy = jasmine.createSpyObj('ProductService', ['getProducts']);

    TestBed.configureTestingModule({
      providers: [
        OfflineService,
        { provide: SaleService, useValue: saleSpy },
        { provide: InventoryService, useValue: inventorySpy },
        { provide: ProductService, useValue: productSpy }
      ]
    });
    
    service = TestBed.inject(OfflineService);
    saleServiceSpy = TestBed.inject(SaleService) as jasmine.SpyObj<SaleService>;
    inventoryServiceSpy = TestBed.inject(InventoryService) as jasmine.SpyObj<InventoryService>;
    productServiceSpy = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    
    // Nettoyer localStorage avant chaque test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect online status', () => {
    expect(service.isOnline()).toBe(navigator.onLine);
  });

  it('should save offline sale', () => {
    const saleData = {
      session: 1,
      customer_name: 'Test Customer',
      items: [
        {
          product: 1,
          product_name: 'Test Product',
          quantity: 1,
          unit_price: 100,
          subtotal: 100
        }
      ],
      subtotal: 100,
      discount: 0,
      tax: 18,
      total: 118,
      payment_method: 'cash',
      payment_status: 'paid',
      status: 'completed'
    };

    const saleId = service.saveOfflineSale(saleData);
    expect(saleId).toBeTruthy();
    expect(saleId.startsWith('offline_')).toBe(true);

    const offlineSales = service.getOfflineSales();
    expect(offlineSales.length).toBe(1);
    expect(offlineSales[0].customer_name).toBe('Test Customer');
    expect(offlineSales[0].synced).toBe(false);
  });

  it('should get unsynced sales', () => {
    const saleData = {
      session: 1,
      customer_name: 'Test Customer',
      items: [],
      subtotal: 100,
      discount: 0,
      tax: 18,
      total: 118,
      payment_method: 'cash',
      payment_status: 'paid',
      status: 'completed'
    };

    service.saveOfflineSale(saleData);
    const unsynced = service.getUnsyncedSales();
    expect(unsynced.length).toBe(1);
  });

  it('should mark sale as synced', () => {
    const saleData = {
      session: 1,
      customer_name: 'Test Customer',
      items: [],
      subtotal: 100,
      discount: 0,
      tax: 18,
      total: 118,
      payment_method: 'cash',
      payment_status: 'paid',
      status: 'completed'
    };

    const saleId = service.saveOfflineSale(saleData);
    service.markSaleAsSynced(saleId);

    const sales = service.getOfflineSales();
    expect(sales[0].synced).toBe(true);
  });

  it('should cache products', () => {
    const products = [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' }
    ];

    service.cacheProducts(products);
    const cached = service.getCachedProducts();
    expect(cached.length).toBe(2);
    expect(cached[0].name).toBe('Product 1');
  });

  it('should cache inventory', () => {
    const inventory = [
      { id: 1, product: 1, quantity: 100 },
      { id: 2, product: 2, quantity: 50 }
    ];

    service.cacheInventory(inventory);
    const cached = service.getCachedInventory();
    expect(cached.length).toBe(2);
    expect(cached[0].quantity).toBe(100);
  });

  it('should clear cache', () => {
    service.cacheProducts([{ id: 1, name: 'Test' }]);
    service.cacheInventory([{ id: 1, product: 1, quantity: 100 }]);
    
    service.clearCache();
    
    expect(service.getCachedProducts().length).toBe(0);
    expect(service.getCachedInventory().length).toBe(0);
  });
});

