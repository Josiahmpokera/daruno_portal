import { useState } from 'react'
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react'
import { Plus, Archive, Truck } from 'lucide-react'

function AssetManagement() {
  const [activeTab, setActiveTab] = useState('fixed')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Asset Modules"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        color="primary"
        variant="underlined"
        classNames={{
          tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
          cursor: 'w-full bg-[#d41f1f]',
          tab: 'max-w-fit px-0 h-12',
          tabContent: 'group-data-[selected=true]:text-[#d41f1f]',
        }}
      >
        <Tab key="fixed" title="Fixed Asset Tracking">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Fixed Assets</h3>
                <p className="text-sm text-slate-500">Buildings, vehicles, and equipment</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Register Asset
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Assets Table" shadow="none">
                <TableHeader>
                  <TableColumn>ASSET ID</TableColumn>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>CATEGORY</TableColumn>
                  <TableColumn>PURCHASE DATE</TableColumn>
                  <TableColumn>VALUE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No fixed assets registered.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="inventory" title="Inventory Control">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Inventory</h3>
                <p className="text-sm text-slate-500">Real-time tracking of stock levels</p>
              </div>
              <Button variant="bordered" startContent={<Plus className="h-4 w-4" />}>
                Add Item
              </Button>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-500">Low Stock Items</p>
                      <h4 className="text-2xl font-bold text-slate-800">0</h4>
                  </div>
                   <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-500">Total Value</p>
                      <h4 className="text-2xl font-bold text-slate-800">$0.00</h4>
                  </div>
              </div>
              <Table aria-label="Inventory Table" shadow="none">
                <TableHeader>
                  <TableColumn>ITEM CODE</TableColumn>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>CATEGORY</TableColumn>
                  <TableColumn>QUANTITY</TableColumn>
                  <TableColumn>UNIT PRICE</TableColumn>
                  <TableColumn>REORDER LEVEL</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Inventory is empty.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}

export default AssetManagement
