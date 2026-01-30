import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export const emailService = {
    sendPasswordResetEmail: async (to: string, resetLink: string) => {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set. Email sending skipped.');
            console.log(`[MOCK EMAIL] Reset link for ${to}: ${resetLink}`);
            return true;
        }

        try {
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [to],
                subject: 'Reset Password - Track Project',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Reset Password</h2>
                        <p>Anda menerima email ini karena adanya permintaan reset password untuk akun Anda di Track Project.</p>
                        <p>Klik tombol di bawah ini untuk mereset password Anda:</p>
                        <a href="${resetLink}" style="display: inline-block; background-color: #26b9f7; color: #020617; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                        <p style="color: #64748b; font-size: 14px;">Link ini akan kadaluarsa dalam 1 jam.</p>
                        <p style="color: #64748b; font-size: 14px;">Jika Anda tidak membuat permintaan ini, abaikan saja email ini.</p>
                    </div>
                `
            });

            if (error) {
                console.error('Resend error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }
};
