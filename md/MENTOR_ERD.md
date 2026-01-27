# Entity Relationship Diagram - Mentor Panel

## Overview
Mentor panel memerlukan relasi antara mentor, class, students, assignments, dan payment tracking.

## Entities & Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                    MENTOR MANAGEMENT SYSTEM                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│    auth.users        │
├──────────────────────┤
│ id (PK)              │
│ email                │
│ raw_user_meta_data   │
└──────────┬───────────┘
           │ 1:1
           │
┌──────────▼──────────────────────┐
│        profiles                  │
├─────────────────────────────────┤
│ id (PK)                          │
│ user_id (FK) - UNIQUE            │
│ full_name                        │
│ avatar_url                       │
│ role (enum)                      │
│ approval_status                  │
│ certificate_url                  │
│ created_at                       │
│ updated_at                       │
└──────────┬──────────────────────┘
           │
           │ 1:N (mentor_id)
           │
    ┌──────┴──────────────────────┐
    │                              │
    │ (Mentor memiliki kelas)      │
    │                              │
┌───▼──────────────────────────────────────┐
│        class_mentors                     │
├──────────────────────────────────────────┤
│ id (PK)                                  │
│ class_id (FK)                            │
│ mentor_id (FK) ──────┐                   │
│ is_available         │                   │
│ max_students         │                   │
│ current_students     │                   │
│ created_at           │                   │
│ UNIQUE(class,mentor) │                   │
└────────────┬─────────┴───────────────────┘
             │ 1:N              │
             │                  │
    ┌────────▼──────────────┐   │
    │      classes          │   │
    ├─────────────────────┤   │
    │ id (PK)             │   │
    │ title               │   │
    │ description         │   │
    │ level               │   │
    │ price               │   │
    │ thumbnail_url       │   │
    │ is_active           │   │
    │ created_at          │   │
    │ updated_at          │   │
    └────────┬────────────┘   │
             │                │
             │ 1:N            │
             │                │
    ┌────────▼──────────────────────────┐
    │       enrollments                  │
    ├───────────────────────────────────┤
    │ id (PK)                           │
    │ user_id (FK)                      │
    │ class_id (FK)                     │
    │ mentor_id (FK) ◄──────────────────┘
    │ progress                          │
    │ enrolled_at                       │
    │ completed_at                      │
    │ UNIQUE(user, class)               │
    └────────┬─────────────────────────┘
             │ 1:N
             │
    ┌────────▼──────────────┐
    │     modules           │
    ├─────────────────────┤
    │ id (PK)             │
    │ class_id (FK)       │
    │ title               │
    │ content             │
    │ video_url           │
    │ order_index         │
    │ created_at          │
    └─────────────────────┘


┌────────────────────────────────┐
│      assignments               │
├────────────────────────────────┤
│ id (PK)                        │
│ class_id (FK)                  │
│ mentor_id (FK) ──────┐         │
│ title                 │        │
│ description           │        │
│ file_url             │        │
│ due_date             │        │
│ created_at           │        │
│ updated_at           │        │
└─────────────────────┘         │
                        (Mentor membuat assignment untuk class)


┌────────────────────────────────┐
│  student_submissions           │
├────────────────────────────────┤
│ id (PK)                        │
│ assignment_id (FK)             │
│ user_id (FK)                   │
│ submission_url                 │
│ submitted_at                   │
│ score                          │
│ feedback                       │
│ graded_at                      │
└────────────────────────────────┘


┌────────────────────────────────┐
│  student_certificates          │
├────────────────────────────────┤
│ id (PK)                        │
│ user_id (FK)                   │
│ class_id (FK)                  │
│ certificate_url                │
│ issued_by (FK - mentor)        │
│ issued_at                      │
└────────────────────────────────┘


┌────────────────────────────────┐
│  mentor_salaries               │
├────────────────────────────────┤
│ id (PK)                        │
│ mentor_id (FK)                 │
│ amount                         │
│ period                         │
│ status                         │
│ paid_at                        │
│ created_at                     │
└────────────────────────────────┘
```

## Penjelasan Hubungan (Relationships)

### 1. **profiles → class_mentors** (1:N)
- **Hubungan**: 1 Mentor dapat mengajar N Class
- **Foreign Key**: `class_mentors.mentor_id` → `profiles.user_id`
- **Deskripsi**: Mentor dapat ditetapkan ke beberapa kelas dengan status ketersediaan

### 2. **classes → class_mentors** (1:N)
- **Hubungan**: 1 Class dapat memiliki N Mentor
- **Foreign Key**: `class_mentors.class_id` → `classes.id`
- **Deskripsi**: 1 kelas bisa memiliki multiple mentor untuk kapasitas lebih besar

### 3. **class_mentors → enrollments** (1:N)
- **Hubungan**: 1 Mentor dalam class dapat memiliki N Student
- **Foreign Key**: `enrollments.mentor_id` → `profiles.user_id`
- **Deskripsi**: Student memilih mentor ketika enroll ke class

### 4. **classes → assignments** (1:N)
- **Hubungan**: 1 Class dapat memiliki N Assignment
- **Foreign Key**: `assignments.class_id` → `classes.id`
- **Deskripsi**: Mentor membuat tugas/assignment untuk class yang diajar

### 5. **assignments → student_submissions** (1:N)
- **Hubungan**: 1 Assignment dapat memiliki N Submission
- **Foreign Key**: `student_submissions.assignment_id` → `assignments.id`
- **Deskripsi**: Banyak student submit jawaban untuk 1 assignment

### 6. **classes → student_certificates** (1:N)
- **Hubungan**: 1 Class dapat menghasilkan N Certificate
- **Foreign Key**: `student_certificates.class_id` → `classes.id`
- **Deskripsi**: Mentor bisa memberikan sertifikat ke student yang menyelesaikan class

### 7. **profiles → mentor_salaries** (1:N)
- **Hubungan**: 1 Mentor dapat memiliki N Record Gaji
- **Foreign Key**: `mentor_salaries.mentor_id` → `profiles.user_id`
- **Deskripsi**: Sistem tracking pembayaran mentor per periode

## Data Types

| Field | Type | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| FK | UUID | Foreign key reference |
| email | TEXT | Email address |
| full_name | TEXT | Nama lengkap |
| avatar_url | TEXT | URL foto profil |
| role | ENUM('admin','mentor','student') | Role user |
| approval_status | TEXT | pending/approved/rejected |
| is_available | BOOLEAN | Status ketersediaan mentor |
| max_students | INTEGER | Quota maksimal student |
| current_students | INTEGER | Jumlah student saat ini |
| progress | INTEGER | Progress (0-100%) |
| amount | NUMERIC | Jumlah gaji/pembayaran |
| score | INTEGER | Nilai submission (0-100) |
| status | TEXT | pending/paid/rejected |
| created_at | TIMESTAMPTZ | Timestamp pembuatan |
| updated_at | TIMESTAMPTZ | Timestamp update terakhir |

## Business Rules (RLS Policies)

### Mentor Permissions
- ✅ View kelas yang diajarnya
- ✅ Create/Edit/Delete assignment untuk classnya
- ✅ View student di classnya
- ✅ Grade student submissions
- ✅ Lihat gaji mereka sendiri
- ✅ Update availability status

### Student Permissions
- ✅ View assignment dari class yang diikuti
- ✅ Submit assignment
- ✅ View score & feedback
- ✅ View certificate milik mereka

### Admin Permissions
- ✅ Manage semua data
- ✅ Approve/Reject mentor aplikasi
- ✅ Set gaji mentor
- ✅ View laporan lengkap

## Table Relationships Summary

```
profiles (Mentor)
    ↓
class_mentors (Assignment Mentor ke Class)
    ↓ 1 Mentor : N Class
classes (Class)
    ├→ modules (Module dalam Class)
    ├→ assignments (Tugas dalam Class)
    │   ├→ student_submissions (Jawaban student)
    │   
    ├→ enrollments (Student di Class)
    │   ├→ student_certificates (Sertifikat untuk Student)
    │   
    └→ mentor_salaries (Gaji Mentor)
```

## Penjelasan Mentor Panel Features

### 1. **MentorDashboard** - Ringkasan aktivitas mentor
   - Total student
   - Total class
   - Pending submissions
   - Recent activity

### 2. **MentorClassesPage** - Manage classes
   - View kelas yang diajar
   - Edit class details
   - Update availability

### 3. **MentorStudentsPage** - Kelola student
   - Lihat list student per class
   - Monitor progress
   - View performance

### 4. **MentorAssignments** - Manage assignments
   - Create assignment
   - Edit assignment
   - Delete assignment
   - Grade submissions

### 5. **MentorSubmissions** - Review submissions
   - View student submissions
   - Add score & feedback
   - Download submission files

### 6. **MentorModules** - Manage content
   - Create/Edit module
   - Upload video
   - Organize content

### 7. **MentorProfile** - Profile management
   - Update profile info
   - View certificate
   - View salary info
