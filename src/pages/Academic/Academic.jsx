import { useState } from 'react'
import {
  Tabs,
  Tab,
} from '@heroui/react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import ClassSubjectManagement from '../../components/Academic/ClassSubjectManagement'
import TimetableScheduling from '../../components/Academic/TimetableScheduling'
import AttendanceManagement from '../../components/Academic/AttendanceManagement'
import ExaminationGrading from '../../components/Academic/ExaminationGrading'
import CurriculumLessonPlanning from '../../components/Academic/CurriculumLessonPlanning'
import BehavioralSkillsAssessment from '../../components/Academic/BehavioralSkillsAssessment'

function Academic() {
  const [activeTab, setActiveTab] = useState('class-subject')

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Academic</h1>
          <p className="text-sm text-slate-500">
            Manage classes, subjects, timetables, attendance, exams, and curriculum
          </p>
        </div>

        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Academic Modules"
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            color="danger"
            classNames={{
              cursor: "bg-[#d41f1f]",
              tabContent: "group-data-[selected=true]:text-white"
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