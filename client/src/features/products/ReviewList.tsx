import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReviews, useDeleteReview } from './useReviews';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { RatingStars } from '../../components/RatingStars';
import { Button } from '../../components/Button';
import { Pagination } from '../../components/Pagination';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { useI18n } from '../../lib/i18n';

type Props = {
  productId: string;
  productTitle: string;
  initialAverage?: number;
  initialCount?: number;
};

export function ReviewList({
  productId,
  productTitle,
  initialAverage = 0,
  initialCount = 0,
}: Props) {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const { user } = useAuth();
  const { notify } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading } = useReviews(productId, page);
  const deleteMutation = useDeleteReview(productId);

  const reviews = data?.reviews ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

  const average = stats?.average ?? initialAverage;
  const totalCount = stats?.total ?? initialCount;
  const distribution = stats?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const userHasReviewed = Boolean(data?.userHasReviewed);
  const isVerifiedPurchaser = Boolean(data?.isVerifiedPurchaser);

  const handleDelete = (reviewId: string) => {
    deleteMutation.mutate(reviewId, {
      onSuccess: () => {
        notify(t('reviews.deleteSuccess'), 'success');
      },
      onError: () => {
        notify(t('reviews.deleteError'), 'error');
      },
    });
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      notify(t('reviews.signInPrompt'), 'error');
      navigate('/login', { state: { from: location.pathname, reason: 'review' } });
      return;
    }
    setFormOpen(true);
  };

  return (
    <section
      id="reviews"
      data-testid="reviews-section"
      className="mt-16 border-t border-hairline/80 pt-12"
      aria-labelledby="reviews-heading"
    >
      {/* Section Header */}
      <div className="flex flex-col gap-2 mb-8">
        <span className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase text-gold-leaf font-semibold">
          {t('reviews.overallRating')}
        </span>
        <h2
          id="reviews-heading"
          className="font-display text-step-3 text-ink font-normal tracking-tight"
        >
          {t('reviews.title')}
        </h2>
        <p className="font-sans text-[0.875rem] text-stone leading-relaxed max-w-2xl">
          {t('reviews.subtitle')}
        </p>
      </div>

      {/* Summary Block: Score + Distribution Bar Chart + CTA Card */}
      <div className="grid gap-8 md:grid-cols-12 bg-silk/30 dark:bg-canvas/50 border border-hairline/70 p-6 sm:p-8 rounded-sm mb-12 shadow-sm">
        {/* Score Column */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col justify-center gap-2 border-b md:border-b-0 md:border-e border-hairline/60 pb-6 md:pb-0 md:pe-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-normal text-ink tabular-nums">
              {totalCount > 0 ? average.toFixed(1) : '—'}
            </span>
            <span className="text-stone font-sans text-sm">/ 5.0</span>
          </div>
          <div className="flex items-center gap-2">
            <RatingStars value={average} />
          </div>
          <p className="font-sans text-[0.75rem] text-stone tracking-wide">
            {totalCount === 1
              ? t('reviews.basedOnSingle')
              : t('reviews.basedOn', { count: totalCount })}
          </p>
        </div>

        {/* Distribution Chart Column */}
        <div className="md:col-span-5 lg:col-span-6 flex flex-col justify-center gap-2.5 py-1">
          {[5, 4, 3, 2, 1].map((starNum) => {
            const count = distribution[starNum as 1 | 2 | 3 | 4 | 5] || 0;
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

            return (
              <div
                key={starNum}
                data-testid={`distribution-row-${starNum}`}
                className="flex items-center gap-3 text-[0.75rem] font-sans"
              >
                <span className="w-9 text-stone font-medium flex items-center justify-end gap-1">
                  <span>{starNum}</span>
                  <span className="text-gold-leaf text-xs">★</span>
                </span>

                <div className="flex-1 h-2 bg-sand/40 dark:bg-canvas/90 rounded-full overflow-hidden border border-hairline/40">
                  <div
                    className="h-full bg-gold-leaf transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${starNum} stars: ${count} reviews (${percentage}%)`}
                  />
                </div>

                <span className="w-12 text-stone/80 tabular-nums text-end">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA Column */}
        <div className="md:col-span-3 lg:col-span-3 flex flex-col justify-center items-start md:items-end gap-3 border-t md:border-t-0 md:border-s border-hairline/60 pt-6 md:pt-0 md:ps-6">
          {user?.role === 'seller' ? (
            <div className="w-full text-start md:text-end text-[0.8125rem] text-stone/80 italic font-sans">
              {t('reviews.sellerNoReview')}
            </div>
          ) : userHasReviewed ? (
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-[0.8125rem] font-medium font-sans">
              <svg
                width="16"
                height="16"
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
              <span>{t('reviews.alreadyReviewed')}</span>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleWriteReviewClick}
              size="md"
              className="w-full md:w-auto"
            >
              {t('reviews.writeReview')}
            </Button>
          )}

          {isVerifiedPurchaser && !userHasReviewed && (
            <p className="text-[0.7rem] text-emerald-800 dark:text-emerald-400 font-sans text-start md:text-end">
              ✓ {t('reviews.verifiedPurchase')}
            </p>
          )}
        </div>
      </div>

      {/* Review Feed */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="flex flex-col gap-6 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-hairline/80 rounded-sm">
            <p className="font-display text-step-1 text-ink font-normal">
              {t('reviews.noReviews')}
            </p>
            <p className="font-sans text-[0.8125rem] text-stone mt-1 max-w-md mx-auto">
              {t('reviews.noReviewsDesc')}
            </p>
            {(!user || user.role === 'customer') && !userHasReviewed && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleWriteReviewClick}
                className="mt-4"
              >
                {t('reviews.writeReview')}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {reviews.map((rev) => (
              <ReviewCard
                key={rev._id}
                review={rev}
                currentUserId={user?._id}
                currentUserRole={user?.role}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}

            {/* Pagination Controls */}
            {pagination && pagination.lastPage > 1 && (
              <div className="pt-6 flex justify-center">
                <Pagination
                  currentPage={pagination.currentPage}
                  lastPage={pagination.lastPage}
                  onNavigate={setPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      <ReviewForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        productId={productId}
        productTitle={productTitle}
        isVerifiedPurchaser={isVerifiedPurchaser}
      />
    </section>
  );
}
