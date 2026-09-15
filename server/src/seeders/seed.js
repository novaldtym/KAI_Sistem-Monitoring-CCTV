const { sequelize, User, Station, CCTVPoint, MonitoringReport, MonitoringDetail } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synced.');

    // === USERS ===
    console.log('👤 Seeding users...');
    const manager = await User.create({
      nipp: '99999',
      nama: 'MANAGER 1',
      email: 'manager1@kai.id',
      password_hash: '12345',
      role: 'assistant_manager',
      jabatan: 'Assistant Manager IT Support 1',
    });

    const petugas = await User.create({
      nipp: '12345',
      nama: 'PETUGAS 1',
      email: 'petugas1@kai.id',
      password_hash: '12345',
      role: 'petugas',
      jabatan: 'Petugas IT Support',
    });

    // === STATIONS ===
    console.log('🏢 Seeding stations...');
    const stLempuyangan = await Station.create({
      nama_stasiun: 'Stasiun Lempuyangan',
      business_area: 'B060',
      kode_stasiun: 'LPN',
      hari_mulai_m1: 5,
    });

    // === CCTV POINTS ===
    console.log('📹 Seeding CCTV points...');
    const cctvNames = [
      'LPN - Sandal Mushola',
      'LPN - PPKA',
      'LPN - Arah Cucian Timur',
      'LPN - Peron Tinggi Timur',
      'LPN - Peron Tinggi Barat',
      'LPN - Depan Indomart',
      'LPN - Utara Angker',
      'LPN - Loket Go Show',
      'LPN - Gate In Out',
      'LPN - Boarding',
      'LPN - CIC & VM',
      'LPN - CS',
      'LPN - Peron 3 Arah Timur',
      'LPN - Ruang Server',
      'LPN - Parkiran Motor',
      'LPN - Mushola',
      'LPN - Toilet Utara',
      'LPN - Toilet Selatan',
      'LPN - Peron 1',
      'LPN - Peron 2',
    ];

    const cctvPoints = [];
    for (let i = 0; i < cctvNames.length; i++) {
      const point = await CCTVPoint.create({
        station_id: stLempuyangan.id,
        nomor_urut: i + 1,
        nama_titik: cctvNames[i],
      });
      cctvPoints.push(point);
    }

    // === SAMPLE REPORT ===
    console.log('📋 Seeding sample report...');
    const report = await MonitoringReport.create({
      station_id: stLempuyangan.id,
      bulan: 12,
      tahun: 2025,
      no_ref: '001/01/2025',
      tanggal_m1: '2025-12-05',
      tanggal_m2: '2025-12-12',
      tanggal_m3: '2025-12-19',
      tanggal_m4: '2025-12-26',
      checked_at_m1: '2025-12-05',
      checked_at_m2: '2025-12-12',
      checked_at_m3: '2025-12-19',
      checked_at_m4: '2025-12-26',
      catatan: '',
      status: 'approved',
      created_by: petugas.id,
    });

    for (const point of cctvPoints) {
      await MonitoringDetail.create({
        report_id: report.id,
        cctv_point_id: point.id,
        m1_berfungsi: 'V', m1_terbackup: 'V',
        m2_berfungsi: 'V', m2_terbackup: 'V',
        m3_berfungsi: 'V', m3_terbackup: 'V',
        m4_berfungsi: 'V', m4_terbackup: 'V',
      });
    }

    console.log('');
    console.log('✅ Seeding selesai!');
    console.log('');
    console.log('=== AKUN LOGIN ===');
    console.log('Assistant Manager : NIPP=99999, Password=12345');
    console.log('Petugas           : NIPP=12345, Password=12345');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding gagal:', error);
    process.exit(1);
  }
}

seed();
