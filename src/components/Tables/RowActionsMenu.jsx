import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react'
import { MoreHorizontal } from 'lucide-react'

/**
 * Compact row actions dropdown for tables.
 *
 * items: [{ key, label, color?: 'default'|'primary'|'danger'|'warning', onPress, show?: boolean }]
 */
function RowActionsMenu({
  items = [],
  label = 'Actions',
  ariaLabel = 'Row actions',
  size = 'sm',
}) {
  const visible = items.filter((item) => item && item.show !== false)

  if (!visible.length) {
    return <span className="text-[10px] text-zinc-300">—</span>
  }

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          size={size}
          variant="flat"
          radius="md"
          className="h-6 min-w-0 gap-1 px-1.5 text-[10px] font-medium text-zinc-600"
          endContent={<MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2} />}
          aria-label={ariaLabel}
        >
          {label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={ariaLabel}
        onAction={(key) => {
          const item = visible.find((i) => String(i.key) === String(key))
          item?.onPress?.()
        }}
        itemClasses={{
          base: 'text-[12px] data-[hover=true]:bg-zinc-100',
          title: 'text-[12px]',
        }}
      >
        {visible.map((item) => (
          <DropdownItem
            key={item.key}
            color={item.color || 'default'}
            className={
              item.color === 'danger'
                ? 'text-danger'
                : item.color === 'warning'
                  ? 'text-warning'
                  : ''
            }
            startContent={item.icon || null}
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}

export default RowActionsMenu
