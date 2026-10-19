/** Shared form control styles — border only, same height, small radius */

export const FIELD_RADIUS = 'sm'
export const FIELD_H = 'h-9 min-h-9 max-h-9'

export const fieldClassNames = {
  base: 'w-full',
  inputWrapper: [
    FIELD_H,
    'px-3 py-0',
    'shadow-none !shadow-none border border-zinc-200 bg-white rounded-md',
    'data-[hover=true]:border-zinc-300',
    'group-data-[focus=true]:border-[#0B3D2E]',
    'group-data-[focus=true]:shadow-none group-data-[focus=true]:!shadow-none',
    'group-data-[invalid=true]:!border-rose-400',
  ].join(' '),
  input: 'text-sm leading-none h-full',
  innerWrapper: 'h-full',
  label: 'text-[11px]',
}

export const selectClassNames = {
  base: 'w-full',
  mainWrapper: 'w-full',
  trigger: [
    FIELD_H,
    'px-3 py-0',
    'shadow-none !shadow-none border border-zinc-200 bg-white rounded-md',
    'data-[hover=true]:border-zinc-300',
    'data-[focus=true]:border-[#0B3D2E] data-[open=true]:border-[#0B3D2E]',
    'group-data-[invalid=true]:!border-rose-400',
  ].join(' '),
  innerWrapper: 'gap-1',
  value: 'text-sm text-zinc-800 leading-none',
  selectorIcon: 'w-4 h-4 end-2',
  label: 'text-[11px]',
  popoverContent: 'rounded-md shadow-none border border-zinc-200',
  listbox: 'rounded-md',
}

export const textareaClassNames = {
  base: 'w-full',
  inputWrapper: [
    'shadow-none !shadow-none border border-zinc-200 bg-white rounded-md px-3 py-2',
    'data-[hover=true]:border-zinc-300',
    'group-data-[focus=true]:border-[#0B3D2E] group-data-[focus=true]:shadow-none',
  ].join(' '),
  input: 'text-sm',
}

export const btnSolid =
  'h-9 min-h-9 bg-[#0B3D2E] text-white shadow-none !shadow-none rounded-md'
export const btnBordered =
  'h-9 min-h-9 shadow-none !shadow-none rounded-md border border-zinc-200 bg-white'
export const btnLight = 'h-9 min-h-9 shadow-none !shadow-none rounded-md'
export const btnFlat = 'h-9 min-h-9 shadow-none !shadow-none rounded-md'
