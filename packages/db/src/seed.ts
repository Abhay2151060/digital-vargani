import { withTransaction } from './client';

export async function seedDatabase() {
  console.log('Seeding database with primary Admin user...');

  await withTransaction(async (client) => {
    const defaultHash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90:9c90fa9b1f9184ac23d9da426f479e347dc64936df6a1b9b2e17ab59647db2e4ca3b567252adb83761231a6332f821a6e4f608e844914b5bd935363758140bbf';

    // 1. Create or Update Primary Admin User (Abhay Solapure)
    let adminRes = await client.query(`SELECT id FROM users WHERE username = 'abhay' OR phone = '8421692967' OR full_name = 'Abhay Solapure'`);
    let adminId: string;
    if ((adminRes.rowCount ?? 0) > 0) {
      adminId = adminRes.rows[0].id;
      await client.query(`
        UPDATE users 
        SET username = 'abhay', phone = '8421692967', full_name = 'Abhay Solapure',
            password_hash = COALESCE(password_hash, $1)
        WHERE id = $2
      `, [defaultHash, adminId]);
    } else {
      const inserted = await client.query(`
        INSERT INTO users (username, phone, full_name, password_hash, must_change_password, preferred_language)
        VALUES ('abhay', '8421692967', 'Abhay Solapure', $1, TRUE, 'mr')
        RETURNING id
      `, [defaultHash]);
      adminId = inserted.rows[0].id;
    }

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

    // 3. Add Abhay Solapure as Admin Member
    await client.query(`
      INSERT INTO mandal_members (mandal_id, user_id, role, status)
      VALUES ($1, $2, 'ADMIN', 'ACTIVE')
      ON CONFLICT (mandal_id, user_id) DO UPDATE SET role = 'ADMIN', status = 'ACTIVE';
    `, [mandalId, adminId]);

    // 4. Backward-compatible secondary admin (Omkar Bhagat)
    let secondaryRes = await client.query(`SELECT id FROM users WHERE username = 'omkar' OR phone = '8574968596'`);
    let secondaryId: string;
    if ((secondaryRes.rowCount ?? 0) > 0) {
      secondaryId = secondaryRes.rows[0].id;
      await client.query(`
        UPDATE users
        SET username = 'omkar', phone = '8574968596', full_name = 'Omkar Bhagat',
            password_hash = COALESCE(password_hash, $1)
        WHERE id = $2
      `, [defaultHash, secondaryId]);
    } else {
      const inserted = await client.query(`
        INSERT INTO users (username, phone, full_name, password_hash, must_change_password, preferred_language)
        VALUES ('omkar', '8574968596', 'Omkar Bhagat', $1, TRUE, 'mr')
        RETURNING id
      `, [defaultHash]);
      secondaryId = inserted.rows[0].id;
    }
    await client.query(`
      INSERT INTO mandal_members (mandal_id, user_id, role, status)
      VALUES ($1, $2, 'ADMIN', 'ACTIVE')
      ON CONFLICT (mandal_id, user_id) DO UPDATE SET role = 'ADMIN', status = 'ACTIVE';
    `, [mandalId, secondaryId]);

    console.log('Seed completed successfully for mandal:', mandalId, 'with Admin Abhay Solapure (abhay / 8421692967)');
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


