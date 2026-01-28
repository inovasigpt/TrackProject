export const INITIAL_PROJECTS = [
    {
        id: '1',
        name: 'Proyek A: Cloud Migration',
        code: 'CORE-MIG-01',
        status: 'On Track',
        priority: 'High',
        description: 'Migrasi infrastruktur on-premise ke cloud AWS menggunakan arsitektur microservices.',
        pic: {
            name: 'Marcus Thorne',
            role: 'Solutions Architect',
            avatar: 'https://i.pravatar.cc/150?u=marcus'
        },
        phases: [
            { id: 'design', progress: 100, startDate: '2026-01-01', endDate: '2026-01-20' },
            { id: 'dev', progress: 65, startDate: '2026-01-21', endDate: '2026-03-10' },
            { id: 'unit_test', progress: 0, startDate: '2026-03-11', endDate: '2026-03-31' },
            { id: 'sit', progress: 0, startDate: '2026-04-01', endDate: '2026-04-20' },
        ]
    },
    {
        id: '2',
        name: 'Proyek B: Payment Gateway v2',
        code: 'PAY-GW-02',
        status: 'At Risk',
        priority: 'Medium',
        description: 'Integrasi sistem pembayaran baru untuk mendukung transaksi cross-border.',
        pic: {
            name: 'Elara Vance',
            role: 'Technical Lead',
            avatar: 'https://i.pravatar.cc/150?u=elara'
        },
        phases: [
            { id: 'design', progress: 100, startDate: '2026-01-15', endDate: '2026-02-10' },
            { id: 'dev', progress: 20, startDate: '2026-02-11', endDate: '2026-04-15' },
        ]
    },
    {
        id: '3',
        name: 'Proyek C: Mobile Banking App',
        code: 'MOB-BANK-03',
        status: 'On Track',
        priority: 'High',
        description: 'Pengembangan aplikasi mobile banking dengan fitur biometrik dan notifikasi real-time.',
        pic: {
            name: 'Zara Chen',
            role: 'Product Manager',
            avatar: 'https://i.pravatar.cc/150?u=zara'
        },
        phases: [
            { id: 'design', progress: 100, startDate: '2026-01-05', endDate: '2026-01-25' },
            { id: 'dev', progress: 45, startDate: '2026-01-26', endDate: '2026-03-20' },
            { id: 'unit_test', progress: 0, startDate: '2026-03-21', endDate: '2026-04-10' },
            { id: 'sit', progress: 0, startDate: '2026-04-11', endDate: '2026-04-30' },
            { id: 'uat', progress: 0, startDate: '2026-05-01', endDate: '2026-05-20' },
            { id: 'implementation', progress: 0, startDate: '2026-05-21', endDate: '2026-06-01' },
        ]
    },
];
