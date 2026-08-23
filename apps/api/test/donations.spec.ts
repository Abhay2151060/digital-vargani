import { Test, TestingModule } from '@nestjs/testing';
import { DonationsService } from '../src/donations/donations.service';
import { DbService } from '../src/db/db.service';
import { PaymentMode, Language } from '@vargani/types';

describe('DonationsService', () => {
  let donationsService: DonationsService;
  let mockDbService: any;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      query: jest.fn(),
    };

    mockDbService = {
      query: jest.fn(),
      withTransaction: jest.fn().mockImplementation(async (cb) => cb(mockClient)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        { provide: DbService, useValue: mockDbService },
      ],
    }).compile();

    donationsService = module.get<DonationsService>(DonationsService);
  });

  describe('createDonation', () => {
    it('should allocate receipt number and insert donation in transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ receipt_prefix: 'G' }], rowCount: 1 }) // Mandal prefix
        .mockResolvedValueOnce({ rows: [{ id: 'alloc-1', range_start: 1, range_end: 500, current_number: 1 }], rowCount: 1 }) // Allocation
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Update allocation counter
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'don-1',
              receipt_number: 'G-001',
              donor_name: 'Amit Shah',
              amount: 1001,
              payment_mode: PaymentMode.CASH,
            },
          ],
          rowCount: 1,
        });

      const res = await donationsService.createDonation('volunteer-1', {
        mandal_id: 'mandal-1',
        donor_name: 'Amit Shah',
        amount: 1001,
        payment_mode: PaymentMode.CASH,
        language: Language.MARATHI,
      });

      expect(res.receipt_number).toBe('G-001');
      expect(res.donor_name).toBe('Amit Shah');
    });

    it('should automatically roll over to next 500-receipt block when range is exhausted', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ receipt_prefix: 'G' }], rowCount: 1 }) // Mandal prefix
        .mockResolvedValueOnce({ rows: [{ id: 'alloc-1', range_start: 1, range_end: 500, current_number: 501 }], rowCount: 1 }) // Range exhausted
        .mockResolvedValueOnce({ rows: [{ max_end: '500' }], rowCount: 1 }) // Max range_end check
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Update allocation block to 501..1000
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'don-501',
              receipt_number: 'G-501',
              donor_name: 'Amit Shah',
              amount: 501,
              payment_mode: PaymentMode.CASH,
            },
          ],
          rowCount: 1,
        });

      const res = await donationsService.createDonation('volunteer-1', {
        mandal_id: 'mandal-1',
        donor_name: 'Amit Shah',
        amount: 501,
        payment_mode: PaymentMode.CASH,
        language: Language.MARATHI,
      });

      expect(res.receipt_number).toBe('G-501');
    });
  });

  describe('getReceiptByNumber', () => {
    it('should mask donor phone if hide_phone_numbers is enabled', async () => {
      mockDbService.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'don-1',
            receipt_number: 'G-001',
            donor_name: 'Sneha Deshmukh',
            donor_phone: '9822012345',
            amount: 501,
            hide_phone_numbers: true,
          },
        ],
        rowCount: 1,
      });

      const res = await donationsService.getReceiptByNumber('demo-mandal', 'G-001');
      expect(res.donor_phone).toBe('98220*****');
    });
  });
});
