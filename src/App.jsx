import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import Login from './pages/Login/Login.jsx'
import RegisterSchool from './pages/RegisterSchool/RegisterSchool.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import ModulePage from './pages/Module/ModulePage.jsx'
import Students from './pages/Students/Students.jsx'
import StudentRegistration from './pages/Students/StudentRegistration.jsx'
import AdmissionNumbers from './pages/Students/AdmissionNumbers.jsx'
import StudentIdGate from './pages/Students/StudentIdGate.jsx'
import AcademicSetup from './pages/Academic/AcademicSetup.jsx'
import FeeWorkspace from './pages/Finance/FeeWorkspace.jsx'
import DailyAttendance from './pages/Attendance/DailyAttendance.jsx'
import ExamWorkspace from './pages/Examinations/ExamWorkspace.jsx'
import ReportCardsWorkspace from './pages/ReportCards/ReportCardsWorkspace.jsx'
import PlatformConsole from './pages/Platform/PlatformConsole.jsx'
import SchoolProfile from './pages/SchoolProfile/SchoolProfile.jsx'
import Staff from './pages/Staff/Staff.jsx'
import { modules } from './config/modules.js'
import {
  RedirectIfAuthenticated,
  RequirePlatform,
  RequireSchool,
} from './auth'

const RICH_ROOTS = new Set([
  'students',
  'staff',
  'academic',
  'finance',
  'attendance',
  'examinations',
  'report-cards',
  'school-profile',
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
        path="/students/:id"
        element={
          <SchoolRoute>
            <StudentIdGate />
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
