import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../utils/cn'

export const GlassInput = forwardRef(function GlassInput(
  {
    className,
    error,
    id,
    label,
    startIcon: StartIcon,
    endIcon: EndIcon,
    type = 'text',
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className={cn('glass-input-group', className)}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className="glass-input-wrap">
        {StartIcon && <StartIcon className="glass-input-icon glass-input-icon--start" size={18} aria-hidden="true" />}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={cn(StartIcon && 'has-start-icon', (EndIcon || isPassword) && 'has-end-icon')}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          disabled={disabled}
          {...props}
        />
        {EndIcon && <EndIcon className="glass-input-icon glass-input-icon--end" size={18} aria-hidden="true" />}
        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={disabled}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="glass-input-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
