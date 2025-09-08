const express = require('express');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const { bookingValidators } = require('../middleware/validators');
const rateLimit = require('../middleware/rateLimit');

module.exports = function bookingRouter(renderWithLayout) {
  const router = express.Router();

  // Lightweight rate limiter for POST /book
  const limiter = rateLimit({ windowMs: 60_000, max: 5 });

  function emailConfigured() {
    const needed = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'ADMIN_EMAIL'];
    return needed.every((k) => process.env[k] && String(process.env[k]).trim() !== '');
  }

  // POST /book
  router.post('/book', limiter, bookingValidators, async (req, res) => {
    try {
      // Honeypot: hidden field 'website'
      const { website } = req.body;
      const formData = collectFormData(req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const mapped = errors.mapped();
        return renderWithLayout(req, res, 'index', {
          title: 'Book a Taxi',
          formData,
          errors: mapped,
        });
      }

      // If honeypot filled, treat as spam: render success without sending email
      if (website && website.trim() !== '') {
        return renderWithLayout(req, res, 'success', {
          title: 'Booking Received',
          summary: formData,
          spamSuppressed: true,
        });
      }

      // If email not configured, accept booking and render success without sending
      if (!emailConfigured()) {
        return renderWithLayout(req, res, 'success', {
          title: 'Booking Received',
          summary: formData,
        });
      }

      // Email is configured: construct transport and send
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.verify();

      const adminEmail = process.env.ADMIN_EMAIL;
      const ccCustomer = String(process.env.BOOKING_CC_CUSTOMER || 'false').toLowerCase() === 'true';

      const subject = `New Taxi Booking - ${formData.fullName} - ${formData.pickupDate} ${formData.pickupTime}`;
      const { html, text } = buildEmailContent(formData);

      const mailOptions = {
        from: {
          name: 'Taxi Booking',
          address: process.env.SMTP_USER,
        },
        to: adminEmail,
        cc: ccCustomer ? formData.email : undefined,
        subject,
        html,
        text,
      };

      await transporter.sendMail(mailOptions);

      return renderWithLayout(req, res, 'success', {
        title: 'Booking Received',
        summary: formData,
      });
    } catch (err) {
      // Do not log secrets; provide helpful message
      const message = 'We could not send your booking right now. Please try again later.';
      return renderWithLayout(req, res, 'error', {
        title: 'Error',
        message,
        error: (process.env.NODE_ENV || 'development') === 'development' ? err : null,
      });
    }
  });

  return router;
};

function collectFormData(body) {
  return {
    fullName: (body.fullName || '').trim(),
    email: (body.email || '').trim(),
    phone: (body.phone || '').trim(),
    pickupAddress: (body.pickupAddress || '').trim(),
    dropoffAddress: (body.dropoffAddress || '').trim(),
    pickupDate: (body.pickupDate || '').trim(),
    pickupTime: (body.pickupTime || '').trim(),
    passengers: Number(body.passengers || 1),
    notes: (body.notes || '').trim(),
  };
}

function buildEmailContent(data) {
  const safe = (v) => String(v || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #111827;">
      <h2 style="margin: 0 0 12px;">New Taxi Booking</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tbody>
          ${row('Full Name', safe(data.fullName))}
          ${row('Email', safe(data.email))}
          ${row('Phone', safe(data.phone))}
          ${row('Pickup Address', safe(data.pickupAddress))}
          ${row('Dropoff Address', safe(data.dropoffAddress))}
          ${row('Pickup Date', safe(data.pickupDate))}
          ${row('Pickup Time', safe(data.pickupTime))}
          ${row('Passengers', safe(data.passengers))}
          ${row('Notes', safe(data.notes || '—'))}
        </tbody>
      </table>
    </div>
  `;

  const text = [
    'New Taxi Booking',
    `Full Name: ${data.fullName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Pickup Address: ${data.pickupAddress}`,
    `Dropoff Address: ${data.dropoffAddress}`,
    `Pickup Date: ${data.pickupDate}`,
    `Pickup Time: ${data.pickupTime}`,
    `Passengers: ${data.passengers}`,
    `Notes: ${data.notes || '—'}`,
  ].join('\n');

  return { html, text };
}

function row(label, value) {
  return `
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600; background: #f9fafb;">${label}</td>
      <td style="border: 1px solid #e5e7eb; padding: 8px;">${value}</td>
    </tr>
  `;
}
