# Privacy Policy for School Management App (test-app)

**Effective Date:** July 13, 2026  
**Last Updated:** July 13, 2026

This Privacy Policy describes how the developer ("we", "us", "our", or "Developer"), acting as a sole developer, collects, uses, stores, and discloses information when you use our mobile application (**test-app**, hereinafter referred to as the "App") and its associated backend service infrastructure.

By downloading, installing, or using this App, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree, please do not use the App.

---

## 1. Developer Identity
This App is developed and maintained by a sole developer.
- **Developer Name:** [Insert Developer Name / Publisher Name]
- **Contact Email:** [Insert Contact Email Address]
- **Developer Type:** Individual / Sole Proprietor

---

## 2. Information We Collect
To provide a fully functioning school management experience across various user roles (Superadmin, Admin, Staff, Teacher, Student, Parent), the App and its backend server collect several categories of information:

### A. Personal Information (Provided by You or Your School)
* **Account Credentials & Auth:** Email address, username, password hashes, JWT security tokens, and Firebase-assigned unique user IDs.
* **Profile Information:** Full name, phone number, gender, date of birth, profile pictures, and designated user roles (Superadmin, Admin, Staff, Teacher, Student, Parent).
* **School & Academic Identifiers:** School ID, classroom assignments, grade levels, rolls, and registration numbers.
* **Academic Performance:** Attendance records, class test marks, grades, exam reports, homework assignments, and teacher feedback.
* **Communications:** Direct messages, comments, files, and notices shared between teachers, students, parents, and administrative staff inside the App.

### B. Financial & Payment Information (Razorpay Integration)
* **School Fee Payments:** If you make payment transactions (such as paying school fees or transport fees) through the App, the payment is processed directly by our third-party payment partner, **Razorpay**. 
* **Data Collected:** Razorpay collects billing details, credit/debit card numbers, bank account numbers, UPI IDs, and transaction details necessary to process payment.
* **Storage Restriction:** We do not collect or store credit/debit card numbers, CVVs, or online banking credentials on our database servers. All payment transactions comply with the Payment Card Industry Data Security Standard (PCI-DSS).

### C. Uploaded Attachments & Media (Cloudflare R2 / S3 Compatible Storage)
* **File Uploads:** Users can upload images, documents, reports, and assignments (e.g., student homework, study sheets, report cards).
* **Storage Location:** These files are securely hosted on a private cloud storage service (**Cloudflare R2 / S3**). Access to these files is strictly authenticated to prevent unauthorized downloads.

### D. Automatically Collected Information & Device Permissions
When you access the App, certain technical data is collected automatically to ensure app stability and correct feature delivery:
* **Device Identification:** Unique Device Identifiers (such as Android ID or IDFV), device model, hardware manufacturer, operating system version, and unique push token.
* **Usage Data:** App launch times, screen views, interaction patterns, feature usage, crash logs, and error telemetry.
* **Network & Connection Data:** IP address, network connection status (Wi-Fi or cellular), and ISP details.

### E. Declared Device Permissions
The App requires the following system permissions to work properly:
1. **INTERNET:** Required to sync school data, send notifications, and fetch updates from the server database.
2. **POST_NOTIFICATIONS (Android 13+):** Required to deliver push notifications for direct alerts, announcements, and messages.
3. **READ_EXTERNAL_STORAGE / READ_MEDIA_IMAGES (Optional):** Required if you choose to upload profile pictures or select homework files/documents from your device gallery.
4. **CAMERA (Optional):** Required if you take photos directly in the App to upload assignments or profile pictures.

---

## 3. How We Use Your Information (Purpose Limitation)
We will never sell your personal data or use it for targeted advertising. We collect and process data solely for the following legitimate purposes:
* **Core App Functionality:** Authenticating logins, rendering custom dashboards based on roles, managing school grades, scheduling, and processing student-parent associations.
* **Processing Transactions:** Enabling secure online fee payments and producing digital invoices via Razorpay.
* **Communications:** Sending direct messages, announcements, and push notification alerts from teachers and school admins.
* **System Operations:** Storing cache data locally using Secure AsyncStorage to maintain seamless sessions.
* **Security & Auditing:** Preventing unauthorized access, protecting student records, and maintaining system logs to debug security issues.
* **Service Quality:** Monitoring application crashes and optimizing performance across different Android hardware versions.

---

## 4. Storage, Security, and Data Retention

### A. Data Security
We implement strict physical, electronic, and administrative safeguards to protect your personal information:
* **Transmission Security:** All communications between the App and our backend server API are encrypted in transit using **HTTPS (Hypertext Transfer Protocol Secure)** with industry-standard SSL/TLS encryption.
* **Local Storage Security:** Session tokens and user preferences are stored securely on your device using native AsyncStorage wrappers.
* **Database Security:** User profiles, login details, and school records are stored in a secure cloud database (**PostgreSQL**) with restricted row-level security and access controls.

### B. Retention Policy
* **Active Accounts:** We retain your personal data for as long as your school or educational institution maintains an active account with our system.
* **Deleted Accounts:** If a school administrator deletes a user profile, all associated personal identifiers (name, email, phone) are deleted or permanently anonymized within **30 days**, subject to legal or audit requirements of the educational institution.

---

## 5. Third-Party Services
To facilitate core features, monitor app stability, and analyze user interactions, the App and its backend infrastructure integrate third-party SDKs that have access to limited device and usage information under their own privacy policies:

1. **Google Firebase (Firebase Cloud Messaging / Admin SDK):**
   * *Purpose:* To deliver push notifications, manage database operations, and authenticate user sessions.
   * *Data Shared:* Device tokens, operating system version, authentication tokens.
   * *Privacy Policy:* [Google Privacy Policy](https://policies.google.com/privacy)
2. **Expo SDK (Expo Notifications):**
   * *Purpose:* To compile the application and manage push notifications.
   * *Data Shared:* Expo push tokens.
   * *Privacy Policy:* [Expo Privacy Policy](https://expo.dev/privacy)
3. **PostHog:**
   * *Purpose:* Product analytics to understand user behavior, feature adoption, and screen navigation flow.
   * *Data Shared:* Session data, event clicks, page/screen views, basic device specifications (OS, device type), and pseudo-anonymized user identifiers.
   * *Privacy Policy:* [PostHog Privacy Policy](https://posthog.com/privacy)
4. **Sentry:**
   * *Purpose:* Real-time error detection, logging application crashes, and identifying code bugs to maintain system uptime.
   * *Data Shared:* Crash telemetry, device specifications, software version, stack trace information.
   * *Privacy Policy:* [Sentry Privacy Policy](https://sentry.io/privacy/)
5. **Razorpay:**
   * *Purpose:* Secure payment processing gateway for school fees.
   * *Data Shared:* Payer email, phone number, payment details, billing address.
   * *Privacy Policy:* [Razorpay Privacy Policy](https://razorpay.com/privacy/)
6. **Cloudflare R2 / AWS S3 Compatible Storage:**
   * *Purpose:* Cloud storage hosting for school documents, homework attachments, and images.
   * *Data Shared:* Uploaded raw binary files (images, PDFs, documents).
   * *Privacy Policy:* [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/) / [AWS Privacy Policy](https://aws.amazon.com/privacy/)

### A. Cookies, Webviews, and Local Caching
The App uses the `@react-native-async-storage/async-storage` library and internal Webview elements (`react-native-webview`) to cache files and manage authenticated sessions locally. While the App does not run third-party advertising cookies, the Webviews may store local session tokens, cookies, or browser cache files generated by your school's server to keep you logged in. You can clear the App data in your device settings to wipe this local cache at any time.

### B. External Links
Our App may display links to school websites, external learning portals (e.g., educational YouTube videos, PDFs, or third-party academic resources) provided by teachers or admins. If you click on an external link, you will be redirected to that site. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.

---

## 6. Children's Privacy & School Records (COPPA, FERPA & GDPR Compliance)
Because our application is a school management utility used by students under the age of 13 and is deployed within school environments:
* **FERPA (US Educational Records):** We handle student educational records in strict compliance with the Family Educational Rights and Privacy Act (FERPA). Student records are only accessed by authorized school staff, teachers, and their parents/guardians.
* **School Authorization (In Loco Parentis):** Accounts for students under 13 are created and authorized directly by the school administration, acting as the school agent on behalf of parents or guardians under COPPA guidelines.
* **Data Minimization for Minors:** We do not collect personal information directly from children without the school or parental consent setup.
* If a parent or guardian discovers that a child has provided us with personal information without consent, please contact us immediately, and we will promptly delete the data.

---

## 7. Your Rights, Data Choices & Account Deletion

Under global regulations such as **GDPR (Europe)**, **CCPA (California)**, and **LGPD (Brazil)**, you have the following rights regarding your data:
* **Right to Access:** You can request a summary of the personal data collected from you.
* **Right to Rectify:** You can update or correct your profile data within the App or through your school administrator.
* **Right to Object/Opt-Out:** You can turn off push notifications directly in the App or device settings.

### Account Deletion & Erasure Policy
Because this App is an institutional school management tool, **all user accounts are managed directly by your respective educational institution (school)**. 
* **How to Request Deletion:** Students, parents, teachers, and staff members who wish to delete their accounts and erase their associated personal data must submit an account deletion request directly to their **School Administrator**.
* **Processing Deletion:** Once the school administration deletes the user account from their school management dashboard, the corresponding authentication credentials, profile data, and academic links are deleted or permanently anonymized on our active database servers within **30 days**.
* **Direct Escalation:** If you are a school administrator wishing to request the complete deletion of a school directory, or if you face issues contacting your school administrator, you may contact the Developer directly at the email listed below to initiate the deletion process.

---

## 8. Changes to This Privacy Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by updating the "Effective Date" at the top of this document and displaying a notice in the App or on the App Store listing page.

---

## 9. Contact Information
If you have any questions, concerns, or data deletion requests regarding this Privacy Policy, please contact the developer:

* **Email:** [Insert Developer Email]
* **Mailing Address:** [Insert Optional Address or delete this line]
