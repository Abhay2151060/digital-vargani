import { TransparencyService } from '../src/transparency/transparency.service';
import { DbService } from '../src/db/db.service';
import { PaymentMode, ExpenseCategory } from '@vargani/types';

describe('TransparencyService', () => {
  let service: TransparencyService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    };
    service = new TransparencyService(mockDb);
  });

  it('should return complete transparency report including ahwal_url, upi_qr_url, and masked donor roll', async () => {
    const slug = 'shivaji-nagar-mitra-mandal';

    mockDb.query
      // 1. Mandal Profile
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'mandal-1',
            name: 'Shivaji Nagar Mitra Mandal',
            slug,
            registration_number: 'E-12345/PUNE',
            city: 'Pune',
            area: 'Shivaji Nagar',
            festival_type: 'GANESHOTSAV',
            logo_url: 'https://example.com/logo.png',
            upi_id: 'mandal@upi',
            upi_qr_url: 'https://example.com/qr.png',
            ahwal_url: 'https://example.com/ahwal.pdf',
            ahwal_title: 'वार्षिक अहवाल २०२४',
            hide_phone_numbers: true,
          },
        ],
      })
      // 2. Collections by mode
      .mockResolvedValueOnce({
        rows: [
          { payment_mode: PaymentMode.CASH, total_amount: '50000.00', count: '100' },
          { payment_mode: PaymentMode.UPI, total_amount: '25000.00', count: '40' },
        ],
      })
      // 3. Expenses by category
      .mockResolvedValueOnce({
        rows: [
          { category: ExpenseCategory.MANDAP, total_amount: '20000.00', count: '2' },
          { category: ExpenseCategory.PRASAD, total_amount: '5000.00', count: '5' },
        ],
      })
      // 4. Donor roll
      .mockResolvedValueOnce({
        rows: [
          {
            receipt_number: 'G-001',
            donor_name: 'Rajesh Sharma',
            donor_phone: '9822012345',
            amount: '1001.00',
            payment_mode: PaymentMode.UPI,
            created_at: new Date().toISOString(),
          },
          {
            receipt_number: 'G-002',
            donor_name: 'Anonymous Devotee',
            donor_phone: null,
            amount: '501.00',
            payment_mode: PaymentMode.CASH,
            created_at: new Date().toISOString(),
          },
        ],
      })
      // 5. Approved expenses list
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'exp-1',
            category: ExpenseCategory.MANDAP,
            amount: '20000.00',
            description: 'Stage decoration and lighting',
            bill_photo_url: 'https://example.com/bill1.jpg',
            created_at: new Date().toISOString(),
          },
        ],
      });

    const report = await service.getTransparencyReport(slug);

    expect(report).toBeDefined();
    expect(report.mandal.name).toBe('Shivaji Nagar Mitra Mandal');
    expect(report.mandal.upi_qr_url).toBe('https://example.com/qr.png');
    expect(report.mandal.ahwal_url).toBe('https://example.com/ahwal.pdf');
    expect(report.mandal.ahwal_title).toBe('वार्षिक अहवाल २०२४');
    expect(report.total_collected).toBe(75000);
    expect(report.total_expenses).toBe(25000);
    expect(report.net_balance).toBe(50000);
    expect(report.total_donors_count).toBe(140);

    // Verify phone masking
    expect(report.donor_roll[0].donor_phone_masked).toBe('98220*****');
    expect(report.donor_roll[1].donor_phone_masked).toBeUndefined();
  });

  it('should throw NotFoundException if mandal does not exist or is inactive', async () => {
    mockDb.query.mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    });

    await expect(service.getTransparencyReport('non-existent-slug')).rejects.toThrow();
  });
});
