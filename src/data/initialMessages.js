// Initial sample messages for inbox
export const INITIAL_MESSAGES = [
    {
        id: 'msg-1',
        from: {
            name: 'Marcus Thorne',
            role: 'Solutions Architect',
            avatar: 'https://i.pravatar.cc/150?u=marcus'
        },
        subject: 'Update Progress Cloud Migration',
        preview: 'Hi, saya ingin menginformasikan bahwa fase development sudah mencapai 65%...',
        body: `Hi,

Saya ingin menginformasikan bahwa fase development untuk proyek Cloud Migration sudah mencapai 65%. 

Beberapa milestone yang sudah tercapai:
- Setup AWS infrastructure
- Database migration completed
- API Gateway configuration

Masih ada beberapa task yang perlu diselesaikan minggu ini:
- Authentication service integration
- Load balancer configuration
- Monitoring setup

Mohon untuk di-review dan berikan feedback jika ada.

Terima kasih,
Marcus Thorne`,
        timestamp: '2026-01-28T09:30:00',
        isRead: false,
        projectId: '1'
    },
    {
        id: 'msg-2',
        from: {
            name: 'Elara Vance',
            role: 'Technical Lead',
            avatar: 'https://i.pravatar.cc/150?u=elara'
        },
        subject: 'Payment Gateway - Butuh Approval',
        preview: 'Untuk integrasi payment gateway, kami butuh approval untuk vendor...',
        body: `Halo,

Untuk integrasi payment gateway v2, kami butuh approval untuk menggunakan vendor Stripe sebagai payment processor utama.

Alasan pemilihan Stripe:
1. Support multi-currency (termasuk IDR)
2. Compliance dengan regulasi cross-border
3. API yang mature dan well-documented
4. Biaya transaksi kompetitif (2.9% + Rp 4.400)

Mohon konfirmasinya agar kami bisa lanjut ke fase development.

Best regards,
Elara Vance`,
        timestamp: '2026-01-28T08:15:00',
        isRead: false,
        projectId: '2'
    },
    {
        id: 'msg-3',
        from: {
            name: 'Zara Chen',
            role: 'Product Manager',
            avatar: 'https://i.pravatar.cc/150?u=zara'
        },
        subject: 'Mobile Banking - Demo Ready',
        preview: 'Demo untuk fitur biometrik sudah siap. Jadwal demo besok jam 10 pagi...',
        body: `Hi Team,

Demo untuk fitur biometric authentication di Mobile Banking App sudah siap.

Jadwal Demo:
- Tanggal: 29 Januari 2026
- Jam: 10:00 WIB
- Meeting Room: Zoom (link akan dikirim via email)

Fitur yang akan di-demo:
1. Fingerprint login
2. Face ID recognition
3. Fallback ke PIN

Mohon kehadirannya untuk memberikan feedback.

Thanks,
Zara Chen`,
        timestamp: '2026-01-27T16:45:00',
        isRead: true,
        projectId: '3'
    },
    {
        id: 'msg-4',
        from: {
            name: 'System',
            role: 'PMO Notification',
            avatar: 'https://i.pravatar.cc/150?u=system'
        },
        subject: 'Reminder: Phase SIT akan dimulai',
        preview: 'Proyek Cloud Migration akan memasuki fase SIT pada tanggal 1 April 2026...',
        body: `[Automated Notification]

Proyek: Cloud Migration (CORE-MIG-01)
Phase: System Integration Testing (SIT)
Tanggal Mulai: 1 April 2026

Pastikan semua persiapan untuk SIT sudah dilakukan:
- Test environment ready
- Test cases documented
- Test data prepared
- QA team briefed

Ini adalah pengingat otomatis dari sistem PMO.`,
        timestamp: '2026-01-27T09:00:00',
        isRead: true,
        projectId: '1'
    },
    {
        id: 'msg-5',
        from: {
            name: 'Admin PMO',
            role: 'Administrator',
            avatar: 'https://i.pravatar.cc/150?u=admin-pmo'
        },
        subject: 'Weekly Standup Meeting',
        preview: 'Reminder untuk weekly standup meeting setiap Senin jam 9 pagi...',
        body: `Hi All,

Reminder untuk weekly standup meeting:
- Hari: Setiap Senin
- Jam: 09:00 WIB
- Durasi: Max 30 menit
- Format: Zoom/Onsite (hybrid)

Agenda:
1. Progress update per proyek
2. Blockers & issues
3. Action items for the week

Mohon semua PIC hadir tepat waktu.

Regards,
Admin PMO`,
        timestamp: '2026-01-26T14:00:00',
        isRead: false,
        projectId: null
    }
];
