import { useParams } from 'react-router-dom'
import StudentProfile from './StudentProfile.jsx'
import ModulePage from '../Module/ModulePage.jsx'

/**
 * Only treat numeric :id as a student profile.
 * Paths like /students/admission-numbers must not hit getStudent().
 */
function StudentIdGate() {
  const { id } = useParams()
  if (id && /^\d+$/.test(String(id))) {
    return <StudentProfile />
  }
  return <ModulePage />
}

export default StudentIdGate
