import {
  loginSchema,
  createDonationSchema,
  createExpenseSchema,
  createReconciliationSchema,
  PaymentMode,
  ExpenseCategory,
  Language,
} from '@vargani/types';

describe('Validation Schemas (Zod)', () => {
  describe('loginSchema', () => {
    it('should validate valid Indian mobile numbers', () => {
      const valid = loginSchema.safeParse({ phone: '9822012345' });
      expect(valid.success).toBe(true);
    });

    it('should reject landlines or invalid mobile prefixes', () => {
      const invalid = loginSchema.safeParse({ phone: '0202543123' });
      expect(invalid.success).toBe(false);
    });
  });

  describe('createDonationSchema', () => {
    it('should validate valid donation inputs', () => {
      const valid = createDonationSchema.safeParse({
        mandal_id: '123e4567-e89b-12d3-a456-426614174000',
        donor_name: 'Rahul Patil',
        amount: 501,
        payment_mode: PaymentMode.CASH,
        language: Language.MARATHI,
      });
      expect(valid.success).toBe(true);
    });

    it('should reject negative or zero donation amounts', () => {
      const invalid = createDonationSchema.safeParse({
        mandal_id: '123e4567-e89b-12d3-a456-426614174000',
        donor_name: 'Rahul Patil',
        amount: -100,
        payment_mode: PaymentMode.CASH,
      });
      expect(invalid.success).toBe(false);
    });

    it('should reject empty donor names', () => {
      const invalid = createDonationSchema.safeParse({
        mandal_id: '123e4567-e89b-12d3-a456-426614174000',
        donor_name: '',
        amount: 501,
        payment_mode: PaymentMode.CASH,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('createExpenseSchema', () => {
    it('should validate valid expense inputs', () => {
      const valid = createExpenseSchema.safeParse({
        mandal_id: '123e4567-e89b-12d3-a456-426614174000',
        category: ExpenseCategory.MANDAP,
        amount: 15000,
        description: 'Stage setup advance payment',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject zero expense amounts', () => {
      const invalid = createExpenseSchema.safeParse({
        mandal_id: '123e4567-e89b-12d3-a456-426614174000',
        category: ExpenseCategory.MANDAP,
        amount: 0,
        description: 'Free service',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('createReconciliationSchema', () => {
    it('should validate non-negative cash handover amount', () => {
      const valid = createReconciliationSchema.safeParse({
        mandal_id: '123e4567-e89b-12d3-a456-426614174000',
        volunteer_id: '123e4567-e89b-12d3-a456-426614174001',
        received_amount: 5000,
      });
      expect(valid.success).toBe(true);
    });
  });
});
