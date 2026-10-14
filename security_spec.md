# SAMS Firestore Security Specification

## 1. Data Invariants
- School configuration can only be modified by authenticated Administrators.
- Students cannot modify any assessment scores, term results, attendance records, or report cards.
- Students can only read published report cards and published assessment results where `admissionNumber` or `studentId` belongs to them.
- Subject Teachers can only draft and record scores for their assigned subjects and classes.
- Finalized/Approved term results require Examination Officer, Principal, or Admin approval to publish.
- Staff records can only be created or modified by Administrators.
- Document IDs must conform to sanitized identifiers (regex `^[a-zA-Z0-9_\-]+$`) and bounded lengths.
- No user can elevate their own privileges or assign themselves an admin role.

## 2. The Dirty Dozen Payloads (Malicious Operations to Reject)
1. **Student Self-Grade Injection**: Student writes score of 100 to `/assessment_scores/score123` with their own studentId. (Expected: PERMISSION_DENIED)
2. **Ghost Field Poisoning**: Subject teacher creates assessment with ghost field `isSuperAdminOverride: true`. (Expected: PERMISSION_DENIED)
3. **Admin Self-Promotion**: Unauthenticated or teacher user writes `/admins/{userId}`. (Expected: PERMISSION_DENIED)
4. **Altering Published Report Card**: Student or unauthorized teacher modifies `totalScore` or `classPosition` on `/report_cards/rep1`. (Expected: PERMISSION_DENIED)
5. **Over-Cap Score Entry**: Teacher inputs score of 150 on an assessment with max score 20. (Expected: PERMISSION_DENIED)
6. **Negative Score Poisoning**: Teacher inputs score of -15. (Expected: PERMISSION_DENIED)
7. **Identity Spoofing**: User A creates student record setting `admissionNumber` of existing Student B. (Expected: PERMISSION_DENIED)
8. **Junk ID Denial-of-Wallet Attack**: 1.5MB random string as document ID to `/assessments/{id}`. (Expected: PERMISSION_DENIED)
9. **Blanket Query Scraping**: Unauthenticated client attempts `list` on `/students` or `/assessment_scores`. (Expected: PERMISSION_DENIED)
10. **Terminal State Bypass**: Modifying a term result marked `status: 'published'` without admin or exam officer authorization. (Expected: PERMISSION_DENIED)
11. **Attendance Roster Tampering**: Student submits attendance marking themselves 'present'. (Expected: PERMISSION_DENIED)
12. **PII Data Leak**: Public/unauthenticated user tries to read guardian phone and home address from `/students/{id}`. (Expected: PERMISSION_DENIED)

## 3. Role-Permission Matrix
| Role | Students Read/Write | Score Entry | Result Approval | Report Card Publish | Settings & Staff |
|---|---|---|---|---|---|
| Admin | Full / Full | Full | Full | Full | Full |
| Principal | Full / Read-Only | Read | Full Approval | Full | Read-Only |
| Vice Principal | Full / Read-Only | Read | Approval | Approval | Read-Only |
| Exam Officer | Full / Read-Only | Review & Lock | Verify & Publish | Publish | Read-Only |
| Class Teacher | Class / Class Update | Class Subjects | Review Class | Generate Class | Read-Only |
| Subject Teacher | Assigned / Read | Assigned Subjects | Submit Draft | None | None |
| Student | Self / None | Self Published | None | Self Published | None |
