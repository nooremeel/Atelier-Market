import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityStepper } from './QuantityStepper';

it('decrements and increments, clamping at min', async () => {
  const calls: number[] = [];
  render(<QuantityStepper value={1} onChange={(n) => calls.push(n)} />);
  await userEvent.click(screen.getByLabelText('Decrease quantity'));
  await userEvent.click(screen.getByLabelText('Increase quantity'));
  expect(calls).toEqual([2]); // decrement was disabled at min=1
});
