import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import Login from './pages/Login/Login.jsx'
import RegisterSchool from './pages/RegisterSchool/RegisterSchool.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import ModulePage from './pages/Module/ModulePage.jsx'
import Students from './pages/Students/Students.jsx'
import PeopleOverview from './pages/Students/PeopleOverview.jsx'
import StudentIdentityWorkspace from './pages/Students/StudentIdentityWorkspace.jsx'
import StudentRegistration from './pages/Students/StudentRegistration.jsx'
import AdmissionNumbers from './pages/Students/AdmissionNumbers.jsx'
import StudentIdGate from './pages/Students/StudentIdGate.jsx'
import StudentRecordsWorkspace from './pages/Students/StudentRecordsWorkspace.jsx'
import StudentLifecycleWorkspace from './pages/Students/StudentLifecycleWorkspace.jsx'
import Applications from './pages/Students/Applications.jsx'
import ParentsWorkspace from './pages/Students/ParentsWorkspace.jsx'
import TeachersWorkspace from './pages/Teachers/TeachersWorkspace.jsx'
import JoinApplication from './pages/Apply/JoinApplication.jsx'
import AcademicSetup from './pages/Academic/AcademicSetup.jsx'
import FeeWorkspace from './pages/Finance/FeeWorkspace.jsx'
import FinanceOperationsWorkspace from './pages/Finance/FinanceOperationsWorkspace.jsx'
import AccountingWorkspace from './pages/Finance/AccountingWorkspace.jsx'
import InventoryWorkspace from './pages/Ops/InventoryWorkspace.jsx'
import LibraryWorkspace from './pages/Ops/LibraryWorkspace.jsx'
import TransportWorkspace from './pages/Ops/TransportWorkspace.jsx'
import HostelWorkspace from './pages/Ops/HostelWorkspace.jsx'
import LearningWorkspace from './pages/Learning/LearningWorkspace.jsx'
import HomeworkWorkspace from './pages/Learning/HomeworkWorkspace.jsx'
import DailyAttendance from './pages/Attendance/DailyAttendance.jsx'
import ExamWorkspace from './pages/Examinations/ExamWorkspace.jsx'
import ReportCardsWorkspace from './pages/ReportCards/ReportCardsWorkspace.jsx'
import PlatformConsole from './pages/Platform/PlatformConsole.jsx'
import SchoolProfile from './pages/SchoolProfile/SchoolProfile.jsx'
import Staff from './pages/Staff/Staff.jsx'
import SystemWorkspace from './pages/System/SystemWorkspace.jsx'
import { modules } from './config/modules.js'
import {
  RedirectIfAuthenticated,
  RequirePlatform,
  RequireSchool,
} from './auth'

const RICH_ROOTS = new Set([
  'students',
  'parents',
  'teachers',
  'staff',
  'academic',
  'finance',
  'accounting',
  'inventory',
  'library',
  'transport',
  'hostel',
  'learning',
  'homework',
  'attendance',
  'examinations',
  'report-cards',
  'school-profile',
  'reports',
  'users',
  'compliance',
  'admin',
])

function SchoolRoute({ children }) {
  return <RequireSchool>{children}</RequireSchool>
}

function PlatformRoute({ children }) {
  return <RequirePlatform>{children}</RequirePlatform>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/register-school"
        element={
          <RedirectIfAuthenticated>
            <RegisterSchool />
          </RedirectIfAuthenticated>
        }
      />

      {/* Public join / admission application (no auth) */}
      <Route path="/apply" element={<JoinApplication />} />
      <Route path="/apply/:schoolCode" element={<JoinApplication />} />

      <Route
        path="/dashboard"
        element={
          <SchoolRoute>
            <Dashboard />
          </SchoolRoute>
        }
      />

      {/* Super Admin SaaS Platform — never mixed with school session */}
      <Route
        path="/platform"
        element={
          <PlatformRoute>
            <PlatformConsole />
          </PlatformRoute>
        }
      />
      <Route
        path="/platform/*"
        element={
          <PlatformRoute>
            <PlatformConsole />
          </PlatformRoute>
        }
      />

      {/* School tenant workspaces */}
      <Route
        path="/students"
        element={
          <SchoolRoute>
            <PeopleOverview />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/list"
        element={
          <SchoolRoute>
            <Students />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/profiles"
        element={
          <SchoolRoute>
            <Students />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/registration"
        element={
          <SchoolRoute>
            <StudentRegistration />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/admission-numbers"
        element={
          <SchoolRoute>
            <AdmissionNumbers />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/admissions"
        element={
          <SchoolRoute>
            <Applications />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/parents"
        element={
          <SchoolRoute>
            <StudentRecordsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/medical"
        element={
          <SchoolRoute>
            <StudentRecordsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/previous-school"
        element={
          <SchoolRoute>
            <StudentRecordsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/documents"
        element={
          <SchoolRoute>
            <StudentRecordsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/status"
        element={
          <SchoolRoute>
            <StudentRecordsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/transfers"
        element={
          <SchoolRoute>
            <StudentLifecycleWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/graduation"
        element={
          <SchoolRoute>
            <StudentLifecycleWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/alumni"
        element={
          <SchoolRoute>
            <StudentLifecycleWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/qr"
        element={
          <SchoolRoute>
            <StudentIdentityWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/id-cards"
        element={
          <SchoolRoute>
            <StudentIdentityWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/students/:id"
        element={
          <SchoolRoute>
            <StudentIdGate />
          </SchoolRoute>
        }
      />
      <Route
        path="/parents"
        element={
          <SchoolRoute>
            <ParentsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/parents/*"
        element={
          <SchoolRoute>
            <ParentsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/teachers"
        element={
          <SchoolRoute>
            <TeachersWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/teachers/*"
        element={
          <SchoolRoute>
            <TeachersWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <SchoolRoute>
            <Staff />
          </SchoolRoute>
        }
      />
      <Route
        path="/staff/*"
        element={
          <SchoolRoute>
            <Staff />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/years"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/terms"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/levels"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/streams"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/classes"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/subjects"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/subjects/categories"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/subjects/combinations"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/subjects/class-assignment"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/subjects/teacher-allocation"
        element={
          <SchoolRoute>
            <AcademicSetup />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <SchoolRoute>
            <FeeWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/structures"
        element={
          <SchoolRoute>
            <FeeWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/billing"
        element={
          <SchoolRoute>
            <FeeWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/methods"
        element={
          <SchoolRoute>
            <FeeWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/student-fees"
        element={
          <SchoolRoute>
            <FeeWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/student-fees/:id"
        element={
          <SchoolRoute>
            <FeeWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/invoices"
        element={
          <SchoolRoute>
            <FeeWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/payments"
        element={
          <SchoolRoute>
            <FeeWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/receipts"
        element={
          <SchoolRoute>
            <FinanceOperationsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/refunds"
        element={
          <SchoolRoute>
            <FinanceOperationsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/discounts"
        element={
          <SchoolRoute>
            <FinanceOperationsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/fines"
        element={
          <SchoolRoute>
            <FinanceOperationsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/outstanding"
        element={
          <SchoolRoute>
            <FinanceOperationsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/statements"
        element={
          <SchoolRoute>
            <FinanceOperationsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/reports"
        element={
          <SchoolRoute>
            <FinanceOperationsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/accounting"
        element={
          <SchoolRoute>
            <AccountingWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/accounting/*"
        element={
          <SchoolRoute>
            <AccountingWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <SchoolRoute>
            <InventoryWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/inventory/*"
        element={
          <SchoolRoute>
            <InventoryWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/library"
        element={
          <SchoolRoute>
            <LibraryWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/library/*"
        element={
          <SchoolRoute>
            <LibraryWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/transport"
        element={
          <SchoolRoute>
            <TransportWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/transport/*"
        element={
          <SchoolRoute>
            <TransportWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/hostel"
        element={
          <SchoolRoute>
            <HostelWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/hostel/*"
        element={
          <SchoolRoute>
            <HostelWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/learning"
        element={
          <SchoolRoute>
            <LearningWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/learning/*"
        element={
          <SchoolRoute>
            <LearningWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/homework"
        element={
          <SchoolRoute>
            <HomeworkWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/homework/*"
        element={
          <SchoolRoute>
            <HomeworkWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <SchoolRoute>
            <DailyAttendance />
          </SchoolRoute>
        }
      />
      <Route
        path="/attendance/students/daily"
        element={
          <SchoolRoute>
            <DailyAttendance />
          </SchoolRoute>
        }
      />
      <Route
        path="/examinations"
        element={
          <SchoolRoute>
            <ExamWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/examinations/*"
        element={
          <SchoolRoute>
            <ExamWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/report-cards"
        element={
          <SchoolRoute>
            <ReportCardsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/report-cards/*"
        element={
          <SchoolRoute>
            <ReportCardsWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/school-profile"
        element={
          <SchoolRoute>
            <SchoolProfile />
          </SchoolRoute>
        }
      />
      <Route
        path="/school-profile/*"
        element={
          <SchoolRoute>
            <SchoolProfile />
          </SchoolRoute>
        }
      />

      <Route
        path="/students/*"
        element={
          <SchoolRoute>
            <ModulePage />
          </SchoolRoute>
        }
      />
      <Route
        path="/academic/*"
        element={
          <SchoolRoute>
            <ModulePage />
          </SchoolRoute>
        }
      />
      <Route
        path="/finance/*"
        element={
          <SchoolRoute>
            <ModulePage />
          </SchoolRoute>
        }
      />
      <Route
        path="/attendance/*"
        element={
          <SchoolRoute>
            <ModulePage />
          </SchoolRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <SchoolRoute>
            <SystemWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/reports/*"
        element={
          <SchoolRoute>
            <SystemWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/users"
        element={
          <SchoolRoute>
            <SystemWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/users/*"
        element={
          <SchoolRoute>
            <SystemWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <SchoolRoute>
            <SystemWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/compliance/*"
        element={
          <SchoolRoute>
            <SystemWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <SchoolRoute>
            <SystemWorkspace />
          </SchoolRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <SchoolRoute>
            <SystemWorkspace />
          </SchoolRoute>
        }
      />

      {modules
        .filter((m) => !RICH_ROOTS.has(m.key))
        .map((m) => (
          <Route
            key={m.key}
            path={`${m.path}/*`}
            element={
              <SchoolRoute>
                <ModulePage />
              </SchoolRoute>
            }
          />
        ))}

      <Route path="/classes/*" element={<Navigate to="/academic" replace />} />
      <Route
        path="/settings"
        element={<Navigate to="/admin/settings" replace />}
      />
      <Route
        path="/settings/*"
        element={<Navigate to="/admin/settings" replace />}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
