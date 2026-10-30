import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Divider,
} from '@heroui/react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import StaffManagement from '../../components/Settings/StaffManagement'
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormButton,
} from '../../components/Form'

const VALID_TABS = [
  'general',
  'staff',
  'users',
  'academic',
  'financial',
  'communication',
  'system',
]

const TAB_ALIASES = {
  roles: 'users',
  permissions: 'users',
  notifications: 'communication',
}

function Settings() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const activeTab = useMemo(() => {
    const raw = searchParams.get('tab') || 'general'
    const tab = TAB_ALIASES[raw] || raw
    return VALID_TABS.includes(tab) ? tab : 'general'
  }, [searchParams])

  const onTabChange = (key) => {
    navigate(`/settings?tab=${key}`, { replace: true })
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Settings"
          breadcrumbs={[
            { label: 'System', href: '/settings' },
            { label: 'Settings' },
          ]}
          description="Manage your school configuration and preferences"
        />

        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Settings Options"
            selectedKey={activeTab}
            onSelectionChange={onTabChange}
            color="primary"
            classNames={{
              cursor: "bg-[#12544f]",
              tabContent: "group-data-[selected=true]:text-white"
            }}
          >
            <Tab key="general" title="General & Institute">
              <div className="mt-4 flex flex-col gap-4">
                <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
                  <CardHeader>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold">Institute Information</h3>
                      <p className="text-sm text-slate-500">
                        Basic identity and contact details of the school
                      </p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody className="flex flex-col gap-4 p-6">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <FormField label="School Name">
                        <FormInput placeholder="e.g. Shengena International School" />
                      </FormField>
                      <FormField label="School Code">
                        <FormInput placeholder="e.g. SCH-001" />
                      </FormField>
                      <FormField label="Email Address">
                        <FormInput type="email" placeholder="admin@school.com" />
                      </FormField>
                      <FormField label="Phone Number">
                        <FormInput placeholder="+1 234 567 890" />
                      </FormField>
                      <FormField label="Address" className="md:col-span-2">
                        <FormTextarea placeholder="Enter full address" />
                      </FormField>
                      <FormField label="Website URL" className="md:col-span-2">
                        <FormInput placeholder="https://www.school.com" />
                      </FormField>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <FormButton>Save Changes</FormButton>
                    </div>
                  </CardBody>
                </Card>

                <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
                    <CardHeader>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-semibold">Language & Localization</h3>
                            <p className="text-sm text-slate-500">
                                Configure timezones and formats
                            </p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="flex flex-col gap-4 p-6">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Primary Language">
                              <FormSelect
                                label="Language"
                                placeholder="Select language"
                                value=""
                                onChange={() => {}}
                                options={[
                                  { value: 'en', label: 'English' },
                                  { value: 'es', label: 'Spanish' },
                                  { value: 'fr', label: 'French' },
                                ]}
                              />
                            </FormField>
                            <FormField label="Timezone">
                              <FormSelect
                                label="Timezone"
                                placeholder="Select timezone"
                                value=""
                                onChange={() => {}}
                                options={[
                                  { value: 'utc', label: 'UTC' },
                                  { value: 'est', label: 'EST' },
                                  { value: 'pst', label: 'PST' },
                                ]}
                              />
                            </FormField>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <FormButton>Save Settings</FormButton>
                        </div>
                    </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="staff" title="Staff Management">
              <StaffManagement />
            </Tab>

            <Tab key="users" title="User & Access">
              <div className="mt-4">
                <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
                  <CardHeader>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold">Role-Based Access Control</h3>
                      <p className="text-sm text-slate-500">
                        Manage roles and permissions
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-slate-500">User management settings will appear here.</p>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="academic" title="Academic Configuration">
              <div className="mt-4">
                <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
                   <CardHeader>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold">Classes & Subjects</h3>
                      <p className="text-sm text-slate-500">
                        Define academic structure
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-slate-500">Academic settings will appear here.</p>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="financial" title="Financial & Fee">
              <div className="mt-4">
                 <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
                   <CardHeader>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold">Fee Structure</h3>
                      <p className="text-sm text-slate-500">
                        Manage payments and fees
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-slate-500">Financial settings will appear here.</p>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="communication" title="Communication">
              <div className="mt-4">
                <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
                   <CardHeader>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold">Notifications</h3>
                      <p className="text-sm text-slate-500">
                        Email and SMS settings
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-slate-500">Communication settings will appear here.</p>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="system" title="System & Integration">
              <div className="mt-4">
                <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
                   <CardHeader>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold">Integrations</h3>
                      <p className="text-sm text-slate-500">
                        Connect third-party tools
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-slate-500">System settings will appear here.</p>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Settings
