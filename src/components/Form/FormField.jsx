function FormField({ label, required, children, hint, className = '' }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {label ? (
        <label className="text-[11px] font-medium text-zinc-600">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <p className="text-[10px] text-zinc-400">{hint}</p> : null}
    </div>
  )
}

export default FormField
