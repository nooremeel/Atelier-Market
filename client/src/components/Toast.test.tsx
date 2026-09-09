import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

function Trigger() {
  const { notify } = useToast();
  return <button onClick={() => notify('Saved', 'success')}>go</button>;
}

it('shows and auto-dismisses a toast', () => {
  vi.useFakeTimers();
  try {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByText('go'));
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
