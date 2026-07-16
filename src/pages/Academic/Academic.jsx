import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs, Tab } from '@heroui/react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import ClassSubjectManagement from '../../components/Academic/ClassSubjectManagement'
import TimetableScheduling from '../../components/Academic/TimetableScheduling'
import AttendanceManagement from '../../components/Academic/AttendanceManagement'
import ExaminationGrading from '../../components/Academic/ExaminationGrading'
import CurriculumLessonPlanning from '../../components/Academic/CurriculumLessonPlanning'
import BehavioralSkillsAssessment from '../../components/Academic/BehavioralSkillsAssessment'

const VALID_TABS = [
  'class-subject',
  'timetable',
  'attendance',
  'exams',
  'curriculum',
  'behavioral',
]

function Academic() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab') || 'class-subject'
    return VALID_TABS.includes(tab) ? tab : 'class-subject'
  }, [searchParams])

  const onTabChange = (key) => {
    navigate(`/academic?tab=${key}`, { replace: true })
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Academic"
          breadcrumbs={[
            { label: 'Academic', href: '/academic' },
            { label: 'Academic' },
          ]}
          description="Manage classes, subjects, timetables, attendance, exams, and curriculum"
        />

        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Academic Modules"
            selectedKey={activeTab}
            onSelectionChange={onTabChange}
            color="primary"
            classNames={{
              cursor: 'bg-[#0B3D2E]',
              tabContent: 'group-data-[selected=true]:text-white',
            }}
          >
            <Tab key="class-subject" title="Class & Subject Management">
              <ClassSubjectManagement />
            </Tab>

            <Tab key="timetable" title="Timetable & Scheduling">
              <TimetableScheduling />
            </Tab>

            <Tab key="attendance" title="Attendance Management">
              <AttendanceManagement />
            </Tab>

            <Tab key="exams" title="Examination & Grading">
              <ExaminationGrading />
            </Tab>

            <Tab key="curriculum" title="Curriculum & Lesson Planning">
              <CurriculumLessonPlanning />
            </Tab>

            <Tab key="behavioral" title="Behavioral & Skills Assessment">
              <BehavioralSkillsAssessment />
            </Tab>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Academic
