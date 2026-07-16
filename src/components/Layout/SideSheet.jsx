import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from '@heroui/react'

/**
 * Right-side form sheet (drawer). Use for create/edit forms instead of
 * inline side columns.
 */
function SideSheet({
  isOpen,
  onOpenChange,
  title,
  children,
  footer = null,
  size = 'md',
}) {
  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size={size}
      backdrop="blur"
      classNames={{
        base: 'data-[placement=right]:sm:m-2 data-[placement=right]:sm:rounded-xl',
        wrapper: 'z-[100]',
        backdrop: 'z-[99]',
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-0.5 border-b border-zinc-100 px-5 py-4">
              <span className="text-base font-semibold text-zinc-900">{title}</span>
            </DrawerHeader>
            <DrawerBody className="gap-3 px-5 py-4">{children}</DrawerBody>
            {footer ? (
              <DrawerFooter className="border-t border-zinc-100 px-5 py-3">
                {typeof footer === 'function' ? footer(onClose) : footer}
              </DrawerFooter>
            ) : null}
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export default SideSheet
