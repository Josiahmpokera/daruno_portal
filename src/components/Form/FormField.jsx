import { Children, cloneElement, isValidElement } from 'react'

function FormField({ label, required, children, hint, error, htmlFor, className = '' }) {
  // Give a single control an accessible name from the visible label
  // (screen readers + automation), unless it already has one.
  const only = Children.count(children) === 1 ? Children.only(children) : null
  const control =
    only && isValidElement(only) && typeof only.type !== 'string' && typeof label === 'string' && !only.props['aria-label']
      ? cloneElement(only, { 'aria-label': label })
      : children

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {label ? (
        <label htmlFor={htmlFor} className="text-[11px] font-medium text-zinc-600">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
      ) : null}
      {control}
      {error ? (
        <p className="text-[11px] text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[10px] text-zinc-400">{hint}</p>
      ) : null}
    </div>
  )
}

export default FormField
