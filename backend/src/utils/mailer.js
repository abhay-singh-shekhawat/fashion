/**
 * Password-reset mail. Resend over HTTPS when RESEND_API_KEY is set, otherwise
 * the message is logged so the flow still works on a machine with no mail
 * account. Nothing here throws: a mail failure must not reveal whether an
 * address has an account, and the caller decides what to tell the user.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export const sendPasswordResetEmail = async ({ to, name, link }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM ?? "StyleSense <onboarding@resend.dev>";

    const subject = "Reset your StyleSense password";
    const text = [
        `Hi ${name || "there"},`,
        "",
        "Open this link to choose a new password. It works once and expires in an hour.",
        "",
        link,
        "",
        "If you didn't ask for this, you can ignore this email."
    ].join("\n");

    if (!apiKey) {
        console.log(`[Mail] RESEND_API_KEY not set — reset link for ${to}: ${link}`);
        return { delivered: false };
    }

    try {
        const response = await fetch(RESEND_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ from, to: [to], subject, text })
        });

        if (!response.ok) {
            const body = await response.text().catch(() => "");
            console.warn(`[Mail] Resend rejected the message (${response.status}): ${body.slice(0, 200)}`);
            return { delivered: false };
        }

        return { delivered: true };
    } catch (error) {
        console.warn(`[Mail] Resend request failed: ${error.message}`);
        return { delivered: false };
    }
};
