export interface StepItem {
  id: number;
  title: string;
  description?: string;
}

export interface ProgressStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export function ProgressStepper({
  steps,
  currentStep,
  onStepClick,
  className = '',
}: ProgressStepperProps) {
  return (
    <nav
      aria-label="Progress"
      className={`w-full max-w-2xl mx-auto py-6 ${className}`}
    >
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? 'step' : undefined}
              className={`relative flex items-center ${
                index !== steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className="flex items-center gap-3 group focus:outline-none"
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step indicator circle */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step.id)}
                  aria-label={`${step.title} - Step ${step.id}`}
                  className={`w-8 h-8 rounded-sm flex items-center justify-center font-sans text-[0.75rem] font-medium transition-all select-none ${
                    isCompleted
                      ? 'border border-gold-leaf bg-gold-leaf/20 text-gold-leaf hover:bg-gold-leaf hover:text-najd dark:hover:text-[#121214] cursor-pointer'
                      : isCurrent
                      ? 'border border-gold-leaf bg-gold-leaf text-najd dark:text-[#121214] shadow-[0_0_0_2px_rgba(197,168,128,0.25)]'
                      : 'border border-hairline/80 bg-canvas text-stone/80 dark:text-stone/60 cursor-default'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4 text-gold-leaf group-hover:text-inherit"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>0{step.id}</span>
                  )}
                </button>

                {/* Step Title */}
                <div className="hidden sm:flex flex-col text-start">
                  <span
                    className={`font-sans text-[0.6875rem] tracking-[0.16em] uppercase font-medium transition-colors ${
                      isCurrent
                        ? 'text-gold-leaf font-semibold'
                        : isCompleted
                        ? 'text-ink font-medium'
                        : 'text-stone/70 dark:text-stone/50'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="font-sans text-[0.6875rem] text-stone/60 line-clamp-1">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {index !== steps.length - 1 && (
                <div
                  className="flex-1 mx-3 sm:mx-5 h-px transition-colors select-none"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full ${
                      step.id < currentStep ? 'bg-gold-leaf/70' : 'bg-hairline/60'
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
