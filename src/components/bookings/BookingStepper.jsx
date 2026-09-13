import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

export function BookingStepper({ steps, currentStep, onStepClick }) {
  return (
    <nav className="booking-stepper" aria-label="Booking steps">
      <ol className="stepper-list">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isAccessible = stepNumber <= currentStep

          return (
            <li
              key={step.id || step.title}
              className={cn(
                'stepper-item',
                isCurrent && 'is-current',
                isCompleted && 'is-completed',
              )}
            >
              <button
                type="button"
                className="stepper-button"
                disabled={!isAccessible || isCurrent || currentStep === steps.length}
                onClick={() => isAccessible && onStepClick?.(stepNumber)}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="stepper-indicator">
                  {isCompleted ? <Check size={13} strokeWidth={2.5} aria-hidden="true" /> : stepNumber}
                </span>
                <span className="stepper-label">{step.title}</span>
              </button>
              {index < steps.length - 1 && <span className="stepper-divider" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
