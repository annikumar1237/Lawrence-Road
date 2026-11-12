# Attendance dashboard

Server-side Google Apps Script dashboard for the existing Lawrence Road attendance sheet.

- Email + registered date of birth: verifies against Deor List, then opens a 30-minute session.
- Email with DOB blank: sends a six-digit, five-minute OTP only to the registered email.
- Incorrect DOB never falls back to unverified access. Blank or missing DOB uses OTP.
- Reports derive the employee email from the server session, never from a caller-supplied report email.
- Rate limits, one-time OTPs, five verification attempts, resend cooldown and sign-out.
- Monthly IN, OUT, sheet-calculated hours, missing punches, leave request status, CSV and print.
- No salary, phone, address, coordinates, leave reasons or DOB are returned to the dashboard.

Code.gs includes the HTML interface inline. appsscript.json limits permissions to read-only spreadsheets and sending OTP email. No spreadsheet writes or attendance triggers are added.

Deploy as a web app executing as the project owner. The sign-in screen must be reachable by employees without Google sign-in; attendance is returned only after server-side DOB or OTP verification. Embed the deployed /exec URL below the existing attendance and leave cards in law.html after deployment authorization. Do not use client-side direct sheet queries to bypass verification.

Project prepared: https://script.google.com/home/projects/1LXRw3l-zlqiRNTtcU1IwsiRLrv3nEa9sqBk9YmF80MQ6zHqdCJ2rUBS4/edit

Deployment and live end-to-end checks are pending Google authorization.
