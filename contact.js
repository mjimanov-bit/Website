
const form = document.getElementById("contact-form");
const submitButton = document.getElementById("submit-button");
const formStatus = document.getElementById("form-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const subject = form.elements.subject.value.trim();
  const message = form.elements.message.value.trim();

  if (!name || !email || !subject || !message) {
    formStatus.textContent = "Please complete every field.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  formStatus.textContent = "";

  try {
    const response = await fetch(
      "https://formsubmit.co/ajax/michaelzhymanov@gmail.com",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          _subject: `Parallax Contact: ${subject}`,
          _template: "table",
          _captcha: "true"
        })
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error("The form service rejected the submission.");
    }

    formStatus.textContent =
      "Message sent successfully. Thank you for contacting Parallax!";

    form.reset();
  } catch (error) {
    console.error("Contact form submission failed:", error);

    formStatus.textContent =
      "We couldn't send your message. Please try again or email us directly.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Message";
  }
});
