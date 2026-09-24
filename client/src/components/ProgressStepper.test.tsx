import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressStepper } from './ProgressStepper';

const mockSteps = [
  { id: 1, title: 'Shipping', description: 'Address' },
  { id: 2, title: 'Payment', description: 'Card' },
  { id: 3, title: 'Confirm', description: 'Review' },
];

describe('ProgressStepper', () => {
  it('renders all steps with their titles', () => {
    render(<ProgressStepper steps={mockSteps} currentStep={1} />);
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('indicates current step with aria-current="step"', () => {
    render(<ProgressStepper steps={mockSteps} currentStep={2} />);
    const currentContainer = screen.getByText('Payment').closest('[aria-current="step"]');
    expect(currentContainer).toHaveAttribute('aria-current', 'step');
  });

  it('allows clicking on completed steps', async () => {
    const onStepClick = vi.fn();
    render(<ProgressStepper steps={mockSteps} currentStep={3} onStepClick={onStepClick} />);

    const step1Button = screen.getByLabelText(/shipping - step 1/i);
    expect(step1Button).not.toBeDisabled();
    await userEvent.click(step1Button);

    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it('disables upcoming steps from being clicked', () => {
    const onStepClick = vi.fn();
    render(<ProgressStepper steps={mockSteps} currentStep={1} onStepClick={onStepClick} />);

    const step2Button = screen.getByLabelText(/payment - step 2/i);
    expect(step2Button).toBeDisabled();
  });
});
