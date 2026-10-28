function clean(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid request." });
    }
  }

  // Honeypot: bots that fill this field get a successful response but no email.
  if (body.website) return res.status(200).json({ ok: true });

  const name = clean(body.name, 100);
  const email = clean(body.email, 254);
  const organization = clean(body.organization, 150);
  const interest = clean(body.interest, 100);
  const message = clean(body.message, 5000);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Please fill in your name, email, and message." });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL || !process.env.CONTACT_FROM_EMAIL) {
    console.error("Missing email environment variables.");
    return res.status(500).json({ error: "Email service is not configured yet." });
  }

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#171917">
      <h2>New Parralax inquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${organization ? `<p><strong>Organization:</strong> ${escapeHtml(organization)}</p>` : ""}
      ${interest ? `<p><strong>Interest:</strong> ${escapeHtml(interest)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL,
        to: [process.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `Parralax inquiry from ${name}`,
        html
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);
      return res.status(502).json({ error: "The message could not be sent. Please try again." });
    }

    return res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    console.error("Email request failed:", error);
    return res.status(500).json({ error: "The message could not be sent. Please try again." });
  }
};
