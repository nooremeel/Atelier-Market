import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { it, expect } from 'vitest';
import { Modal } from './Modal';

it('closes on Escape', async () => {
  let open = true;
  const onClose = () => {
    open = false;
  };
  render(
    <Modal open title="Confirm" onClose={onClose}>
      body
    </Modal>,
  );
  await userEvent.keyboard('{Escape}');
  expect(open).toBe(false);
});

it('retains input focus across keystrokes when re-rendering with new onClose reference', async () => {
  function TestModal() {
    const [text, setText] = useState('');
    // Inline recreated onClose function on every keystroke
    return (
      <Modal open title="Focus Test" onClose={() => {}}>
        <input
          data-testid="modal-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Modal>
    );
  }

  const user = userEvent.setup();
  render(<TestModal />);

  const input = screen.getByTestId('modal-input');
  await user.click(input);
  await user.keyboard('hello');

  expect(input).toHaveValue('hello');
  expect(document.activeElement).toBe(input);
});
