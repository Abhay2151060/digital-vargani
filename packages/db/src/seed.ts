import { withTransaction } from './client';

export async function seedDatabase() {
  console.log('Seeding demo database...');

  await withTransaction(async (client) => {
    // 1. Create Demo Users
    const adminRes = await client.query(`
      INSERT INTO users (phone, full_name, preferred_language)
      VALUES ('9876543210', 'Sachin Patil (Admin)', 'mr')
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `);
    const adminId = adminRes.rows[0].id;

    const treasurerRes = await client.query(`
      INSERT INTO users (phone, full_name, preferred_language)
      VALUES ('9876543211', 'Rahul Deshmukh (Treasurer)', 'mr')
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `);
    const treasurerId = treasurerRes.rows[0].id;

    const volunteer1Res = await client.query(`
      INSERT INTO users (phone, full_name, preferred_language)
      VALUES ('9876543212', 'Amit Kadam (Volunteer)', 'mr')
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `);
    const volunteer1Id = volunteer1Res.rows[0].id;

    const volunteer2Res = await client.query(`
      INSERT INTO users (phone, full_name, preferred_language)
      VALUES ('9876543213', 'Rohan Shinde (Volunteer)', 'mr')
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name, preferred_language = 'mr'
      RETURNING id;
    `);
    const volunteer2Id = volunteer2Res.rows[0].id;

    // 2. Create Demo Mandal
    const mandalRes = await client.query(`
      INSERT INTO mandals (
        name, slug, registration_number, city, area, festival_type, 
        receipt_prefix, preset_amounts, hide_phone_numbers, is_active
      )
      VALUES (
        'Shree Shivneri Mitra Mandal', 'shivneri-mitra-mandal', 'MH/2024/PUN/00912',
        'Pune', 'Kothrud', 'GANESHOTSAV', 'SSMM', '{101, 251, 501, 1001, 2101, 5001}',
        TRUE, TRUE
      )
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const mandalId = mandalRes.rows[0].id;

    // 3. Add Members
    await client.query(`
      INSERT INTO mandal_members (mandal_id, user_id, role, status)
      VALUES 
        ($1, $2, 'ADMIN', 'ACTIVE'),
        ($1, $3, 'TREASURER', 'ACTIVE'),
        ($1, $4, 'VOLUNTEER', 'ACTIVE'),
        ($1, $5, 'VOLUNTEER', 'ACTIVE')
      ON CONFLICT (mandal_id, user_id) DO UPDATE SET status = 'ACTIVE';
    `, [mandalId, adminId, treasurerId, volunteer1Id, volunteer2Id]);

    // 4. Allocate Receipt Ranges
    await client.query(`
      INSERT INTO receipt_number_allocations (mandal_id, user_id, range_start, range_end, current_number)
      SELECT $1, $2, 1, 500, 15
      WHERE NOT EXISTS (
        SELECT 1 FROM receipt_number_allocations WHERE mandal_id = $1 AND user_id = $2 AND range_start = 1
      );
    `, [mandalId, volunteer1Id]);

    await client.query(`
      INSERT INTO receipt_number_allocations (mandal_id, user_id, range_start, range_end, current_number)
      SELECT $1, $2, 501, 1000, 501
      WHERE NOT EXISTS (
        SELECT 1 FROM receipt_number_allocations WHERE mandal_id = $1 AND user_id = $2 AND range_start = 501
      );
    `, [mandalId, volunteer2Id]);

    // 5. Seed Sample Donations
    await client.query(`
      INSERT INTO donations (
        mandal_id, volunteer_id, receipt_number, donor_name, donor_phone, 
        amount, payment_mode, flat_wing, language, payment_verification_status, is_reconciled
      )
      VALUES 
        ($1, $2, 'SSMM-001', 'Anand Joshi', '9822001122', 501.00, 'CASH', 'A-201', 'mr', 'NOT_REQUIRED', FALSE),
        ($1, $2, 'SSMM-002', 'Sunita Kulkarni', '9822001133', 1001.00, 'UPI', 'B-104', 'mr', 'VERIFIED', FALSE),
        ($1, $2, 'SSMM-003', 'Vikram Shinde', '9822001144', 251.00, 'CASH', 'C-302', 'mr', 'NOT_REQUIRED', FALSE),
        ($1, $2, 'SSMM-004', 'Deepak More', '9822001155', 2101.00, 'CASH', 'A-405', 'mr', 'NOT_REQUIRED', FALSE)
      ON CONFLICT (mandal_id, receipt_number) DO NOTHING;
    `, [mandalId, volunteer1Id]);

    // 6. Seed Sample Expenses
    const sampleExpenses = [
      { category: 'MANDAP', amount: 15000.00, description: 'Main Pandal decoration advance', status: 'APPROVED', approved_by: adminId, approved_at: new Date() },
      { category: 'SOUND_LIGHTING', amount: 8000.00, description: 'Sound system & LED focus lights booking', status: 'APPROVED', approved_by: adminId, approved_at: new Date() },
      { category: 'PRASAD', amount: 3500.00, description: 'Modak and fruits for daily Aarti', status: 'PENDING', approved_by: null, approved_at: null },
    ];

    for (const exp of sampleExpenses) {
      await client.query(`
        INSERT INTO expenses (mandal_id, logged_by, category, amount, description, status, approved_by, approved_at)
        SELECT $1, $2, $3, $4, $5, $6, $7, $8
        WHERE NOT EXISTS (
          SELECT 1 FROM expenses WHERE mandal_id = $1 AND category = $3 AND description = $5
        );
      `, [mandalId, treasurerId, exp.category, exp.amount, exp.description, exp.status, exp.approved_by, exp.approved_at]);
    }

    console.log('Seed completed successfully for mandal:', mandalId);
  });
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
