import { ReconciliationService } from '../src/reconciliation/reconciliation.service';
import { DiscrepancyStatus, PaymentMode } from '@vargani/types';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      withTransaction: jest.fn(),
    };
    service = new ReconciliationService(mockDb);
  });

  describe('reconcileCash', () => {
    it('should successfully reconcile cash handover with exact amount match (discrepancy 0)', async () => {
      const mandalId = 'mandal-1';
      const volunteerId = 'vol-1';
      const treasurerId = 'tres-1';

      const mockDonations = [
        { id: 'don-1', amount: '500.00' },
        { id: 'don-2', amount: '501.00' },
      ];

      mockDb.withTransaction.mockImplementation(async (callback: any) => {
        const client = {
          query: jest.fn()
            // 1. Fetch unreconciled donations
            .mockResolvedValueOnce({
              rowCount: 2,
              rows: mockDonations,
            })
            // 2. Insert cash_reconciliations
            .mockResolvedValueOnce({
              rowCount: 1,
              rows: [
                {
                  id: 'rec-1',
                  mandal_id: mandalId,
                  volunteer_id: volunteerId,
                  treasurer_id: treasurerId,
                  expected_amount: 1001,
                  received_amount: 1001,
                  discrepancy_amount: 0,
                  discrepancy_status: DiscrepancyStatus.NONE,
                },
              ],
            })
            // 3. Mark donations reconciled
            .mockResolvedValueOnce({ rowCount: 2 }),
        };
        return await callback(client);
      });

      const result = await service.reconcileCash(treasurerId, {
        mandal_id: mandalId,
        volunteer_id: volunteerId,
        received_amount: 1001,
      });

      expect(result).toBeDefined();
      expect(result.discrepancy_status).toBe(DiscrepancyStatus.NONE);
      expect(result.reconciled_donations_count).toBe(2);
    });

    it('should flag discrepancy as OPEN when received amount does not match expected amount', async () => {
      const mandalId = 'mandal-1';
      const volunteerId = 'vol-1';
      const treasurerId = 'tres-1';

      const mockDonations = [
        { id: 'don-1', amount: '1000.00' },
      ];

      mockDb.withTransaction.mockImplementation(async (callback: any) => {
        const client = {
          query: jest.fn()
            .mockResolvedValueOnce({
              rowCount: 1,
              rows: mockDonations,
            })
            .mockResolvedValueOnce({
              rowCount: 1,
              rows: [
                {
                  id: 'rec-2',
                  mandal_id: mandalId,
                  volunteer_id: volunteerId,
                  treasurer_id: treasurerId,
                  expected_amount: 1000,
                  received_amount: 900,
                  discrepancy_amount: -100,
                  discrepancy_status: DiscrepancyStatus.OPEN,
                },
              ],
            })
            .mockResolvedValueOnce({ rowCount: 1 }),
        };
        return await callback(client);
      });

      const result = await service.reconcileCash(treasurerId, {
        mandal_id: mandalId,
        volunteer_id: volunteerId,
        received_amount: 900,
        discrepancy_reason: 'Shortage of Rs. 100 in physical cash envelope',
      });

      expect(result).toBeDefined();
      expect(result.discrepancy_status).toBe(DiscrepancyStatus.OPEN);
      expect(result.discrepancy_amount).toBe(-100);
    });
  });

  describe('resolveDiscrepancy', () => {
    it('should update discrepancy status to RESOLVED with notes', async () => {
      mockDb.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'rec-2',
            discrepancy_status: DiscrepancyStatus.RESOLVED,
            resolved_at: new Date().toISOString(),
            notes: 'Volunteer handed over remaining 100 Rs next morning',
          },
        ],
      });

      const result = await service.resolveDiscrepancy(
        'mandal-1',
        'rec-2',
        DiscrepancyStatus.RESOLVED,
        'Volunteer handed over remaining 100 Rs next morning'
      );

      expect(result.discrepancy_status).toBe(DiscrepancyStatus.RESOLVED);
    });
  });
});
