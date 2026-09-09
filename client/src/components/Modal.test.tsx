import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
