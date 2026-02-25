import { useState } from 'react'
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Textarea,
  Divider,
  Select,
  SelectItem,
} from '@heroui/react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import StaffManagement from '../../components/Settings/StaffManagement'

function Settings() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">
            Manage your school configuration and preferences
          </p>
        </div>

        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Settings Options"
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            color="danger"
            classNames={{
              cursor: "bg-[#d41f1f]",
              tabContent: "group-data-[selected=true]:text-white"
            }}
          >
            <Tab key="general" title="General & Institute">
              <div className="mt-4 flex flex-col gap-4">
                <Card className="border border-slate-200 shadow-none">
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label="School Name"
                        placeholder="e.g. Daruno International School"
                        variant="bordered"
                        labelPlacement="outside"
                      />
                      <Input
                        label="School Code"
                        placeholder="e.g. SCH-001"
                        variant="bordered"
                        labelPlacement="outside"
                      />
                      <Input
                        label="Email Address"
                        placeholder="admin@school.com"
                        type="email"
                        variant="bordered"
                        labelPlacement="outside"
                      />
                      <Input
                        label="Phone Number"
                        placeholder="+1 234 567 890"
                        variant="bordered"
                        labelPlacement="outside"
                      />
                      <div className="md:col-span-2">
                        <Textarea
                          label="Address"
                          placeholder="Enter full address"
                          variant="bordered"
                          labelPlacement="outside"
                        />
                      </div>
                      <div className="md:col-span-2">
                         <Input
                            label="Website URL"
                            placeholder="https://www.school.com"
                            variant="bordered"
                            labelPlacement="outside"
                         />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button className="bg-[#d41f1f] text-white font-medium">
                            Save Changes
                        </Button>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-slate-200 shadow-none">
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Select
                                label="Primary Language"
                                placeholder="Select language"
                                variant="bordered"
                                labelPlacement="outside"
                            >
                                <SelectItem key="en">English</SelectItem>
                                <SelectItem key="es">Spanish</SelectItem>
                                <SelectItem key="fr">French</SelectItem>
                            </Select>
                            <Select
                                label="Timezone"
                                placeholder="Select timezone"
                                variant="bordered"
                                labelPlacement="outside"
                            >
                                <SelectItem key="utc">UTC</SelectItem>
                                <SelectItem key="est">EST</SelectItem>
                                <SelectItem key="pst">PST</SelectItem>
                            </Select>
                        </div>
                         <div className="flex justify-end mt-4">
                            <Button className="bg-[#d41f1f] text-white font-medium">
                                Save Settings
                            </Button>
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
                <Card className="border border-slate-200 shadow-none">
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
                <Card className="border border-slate-200 shadow-none">
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
                 <Card className="border border-slate-200 shadow-none">
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
                <Card className="border border-slate-200 shadow-none">
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
                <Card className="border border-slate-200 shadow-none">
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
