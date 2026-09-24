import { useState } from 'react';
import { RatingStars } from '../../components/RatingStars';
import { useI18n } from '../../lib/i18n';
import type { Review } from '../../types';

type Props = {
  review: Review;
  currentUserId?: string;
  currentUserRole?: string;
  onDelete?: (reviewId: string) => void;
  isDeleting?: boolean;
};

export function ReviewCard({
  review,
  currentUserId,
  currentUserRole,
  onDelete,
  isDeleting = false,
}: Props) {
  const { t, locale } = useI18n();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const authorId = typeof review.userId === 'object' ? review.userId?._id : review.userId;
  const userObjName = typeof review.userId === 'object' ? review.userId?.name : '';
  const rawName = (review.userName?.trim() || userObjName?.trim() || '');
  const email = typeof review.userId === 'object' ? review.userId?.email : '';
  const emailName = email
    ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';
  // Prioritize real name if it exists; only fall back to email indexing or Collector when name does not exist
  const authorName = rawName || emailName || t('reviews.collector');
  const authorAvatar = review.userAvatar || (typeof review.userId === 'object' ? review.userId?.avatar : undefined);

  const isAuthorOrAdmin =
    Boolean(currentUserId && (currentUserId === authorId || currentUserRole === 'admin'));

  const initials = authorName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <article
      data-testid={`review-card-${review._id}`}
      className="border-b border-hairline/60 pb-7 pt-2 transition-colors duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Author info */}
        <div className="flex items-center gap-3">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-10 h-10 rounded-full object-cover border border-hairline"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full bg-sand/30 border border-hairline/80 flex items-center justify-center font-display text-xs text-ink font-medium tracking-wider"
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans font-medium text-[0.875rem] text-ink">{authorName}</span>
              {review.verified && (
                <span
                  data-testid="verified-purchase-badge"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-sans font-medium bg-emerald-900/10 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-700/20"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{t('reviews.verifiedPurchase')}</span>
                </span>
              )}
            </div>
            {formattedDate && (
              <time
                dateTime={review.createdAt}
                className="font-sans text-[0.75rem] text-stone tracking-wide"
              >
                {formattedDate}
              </time>
            )}
          </div>
        </div>

        {/* Delete button (Owner / Admin) */}
        {isAuthorOrAdmin && onDelete && (
          <div className="relative">
            {confirmDelete ? (
              <div className="flex items-center gap-2 text-[0.75rem]">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => onDelete(review._id)}
                  className="text-oxblood hover:underline font-medium"
                >
                  {isDeleting ? t('reviews.deleting') : t('reviews.delete')}
                </button>
                <span className="text-stone/50">·</span>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                  className="text-stone hover:text-ink"
                >
                  {t('reviews.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label={t('reviews.delete')}
                className="p-1.5 text-stone/70 hover:text-oxblood transition-colors rounded-sm"
                title={t('reviews.delete')}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Star rating + Title */}
      <div className="mt-3.5 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <RatingStars value={review.rating} />
        </div>
        <h4 className="font-display text-step-1 text-ink font-normal tracking-tight mt-1">
          {review.title}
        </h4>
      </div>

      {/* Review Body */}
      <p className="mt-2 text-stone font-sans text-step-0 leading-relaxed whitespace-pre-line">
        {review.body}
      </p>
    </article>
  );
}
