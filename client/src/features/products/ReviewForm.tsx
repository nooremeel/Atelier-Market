import { useState, useEffect, FormEvent } from 'react';
import { Modal } from '../../components/Modal';
import { RatingInput } from '../../components/RatingInput';
import { Field } from '../../components/Field';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';
import { useToast } from '../../components/ToastProvider';
import { useSubmitReview } from './useReviews';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../lib/i18n';
import { ApiError } from '../../lib/api';

type Props = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  isVerifiedPurchaser?: boolean;
};

export function ReviewForm({
  open,
  onClose,
  productId,
  productTitle,
  isVerifiedPurchaser = false,
}: Props) {
  const { t } = useI18n();
  let notify = (_msg: string, _variant?: any) => {};
  try {
    const toast = useToast();
    notify = toast.notify;
  } catch {
    // optional outside ToastProvider
  }
  const submitMutation = useSubmitReview(productId);

  let authUser: { name?: string } | null | undefined;
  try {
    const auth = useAuth();
    authUser = auth.user;
  } catch {
    // optional outside AuthProvider
  }

  const [rating, setRating] = useState(5);
  const [name, setName] = useState(authUser?.name || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (authUser?.name && !name) {
      setName(authUser.name);
    }
  }, [authUser?.name]);

  const resetForm = () => {
    setRating(5);
    setName(authUser?.name || '');
    setTitle('');
    setBody('');
    setClientError(null);
  };

  const handleClose = () => {
    if (!submitMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (rating < 1 || rating > 5) {
      setClientError(t('reviews.selectRating'));
      return;
    }
    if (title.trim().length < 2) {
      setClientError(t('reviews.titlePlaceholder'));
      return;
    }
    if (body.trim().length < 10) {
      setClientError(t('reviews.minCharsHint'));
      return;
    }

    submitMutation.mutate(
      {
        rating,
        title: title.trim(),
        body: body.trim(),
        name: name.trim() || undefined,
      },
      {
        onSuccess: () => {
          notify(t('reviews.successToast'), 'success');
          resetForm();
          onClose();
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            if (err.status === 409) {
              setClientError(t('reviews.alreadyReviewed'));
            } else {
              setClientError(err.message || 'Failed to submit review');
            }
          } else {
            setClientError('An unexpected error occurred. Please try again.');
          }
        },
      }
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title={t('reviews.writeReview')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
        <p className="font-sans text-[0.8125rem] text-stone -mt-2">
          {productTitle}
        </p>

        {isVerifiedPurchaser && (
          <div
            data-testid="verified-buyer-form-notice"
            className="flex items-center gap-2 p-3 bg-emerald-900/10 border border-emerald-700/20 rounded-sm text-emerald-800 dark:text-emerald-300 text-[0.75rem] font-sans"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{t('reviews.verifiedBuyerNotice')}</span>
          </div>
        )}

        {clientError && (
          <div
            role="alert"
            className="p-3 rounded-sm bg-oxblood/10 border border-oxblood/30 text-oxblood text-[0.8125rem] font-sans"
          >
            {clientError}
          </div>
        )}

        {/* Rating Input */}
        <RatingInput
          label={t('reviews.ratingLabel')}
          value={rating}
          onChange={setRating}
          disabled={submitMutation.isPending}
        />

        {/* Reviewer Name */}
        <Field
          label={t('reviews.authorNameLabel')}
          name="reviewer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('reviews.authorNamePlaceholder')}
          maxLength={100}
          disabled={submitMutation.isPending}
        />

        {/* Review Title */}
        <Field
          label={t('reviews.titleLabel')}
          name="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('reviews.titlePlaceholder')}
          maxLength={120}
          required
          disabled={submitMutation.isPending}
        />

        {/* Review Body */}
        <div className="flex flex-col gap-1">
          <Textarea
            label={t('reviews.bodyLabel')}
            name="review-body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('reviews.bodyPlaceholder')}
            maxLength={2000}
            required
            disabled={submitMutation.isPending}
            hint={`${body.length}/2000 · ${t('reviews.minCharsHint')}`}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline/60 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitMutation.isPending}
          >
            {t('reviews.cancel')}
          </Button>
          <Button
            type="submit"
            loading={submitMutation.isPending}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? t('reviews.submitting') : t('reviews.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
