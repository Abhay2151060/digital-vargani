import { withTransaction } from './client';

export async function seedDatabase() {
  console.log('Seeding database with primary Admin user...');

  await withTransaction(async (client) => {
    // 1. Create Primary Admin User (Omkar Bhagat)
    const adminRes = await client.query(`
      INSERT INTO users (phone, full_name, preferred_language)
      VALUES ('8574968596', 'Omkar Bhagat', 'mr')
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `);
    const adminId = adminRes.rows[0].id;

    // 2. Create Default Mandal
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

    // 3. Add Omkar Bhagat as Admin Member
    await client.query(`
      INSERT INTO mandal_members (mandal_id, user_id, role, status)
      VALUES ($1, $2, 'ADMIN', 'ACTIVE')
      ON CONFLICT (mandal_id, user_id) DO UPDATE SET role = 'ADMIN', status = 'ACTIVE';
    `, [mandalId, adminId]);

    console.log('Seed completed successfully for mandal:', mandalId, 'with Admin Omkar Bhagat (8574968596)');
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


