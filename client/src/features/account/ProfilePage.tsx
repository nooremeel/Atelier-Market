import { useState, useEffect, useRef } from 'react';
import { useAccountProfile, useUpdateProfile, useUploadImage } from './useAccount';
import { AccountNav } from './AccountNav';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/ToastProvider';
import { useI18n } from '../../lib/i18n';
import { getImageUrl } from '../../lib/image';

export function ProfilePage() {
  const { data, isLoading } = useAccountProfile();
  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadImage();
  const { notify } = useToast();
  const { t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarMode, setAvatarMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const user = data?.user;

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setImgError(false);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'P';

  const memberYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : 2026;

  // Find default address for the patron dossier
  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || (user?.address?.street ? user.address : null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      notify('Please select an image file (PNG, JPG, or WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('File size exceeds 5MB limit.', 'error');
      return;
    }
    if (previewUrl && previewUrl.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    if (typeof URL.createObjectURL === 'function') {
      setPreviewUrl(URL.createObjectURL(file));
    }
    setImgError(false);
  };

  const handleClearFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError(null);

    let finalAvatar = avatar.trim();

    if (selectedFile) {
      try {
        const uploadRes = await uploadImage.mutateAsync(selectedFile);
        finalAvatar = uploadRes.imageUrl;
        setAvatar(finalAvatar);
        setSelectedFile(null);
        setPreviewUrl(null);
      } catch (err: any) {
        const msg = err?.message || 'Failed to upload photograph';
        setSaveError(msg);
        notify(msg, 'error');
        return;
      }
    }

    updateProfile.mutate(
      {
        name: name.trim(),
        phone: phone.trim(),
        avatar: finalAvatar,
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          notify(t('account.profileSavedSuccess'), 'success');
          setTimeout(() => setSaveSuccess(false), 4000);
        },
        onError: (err: any) => {
          const msg = err?.message || t('account.profileSaveError');
          setSaveError(msg);
          notify(msg, 'error');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div>
        <AccountNav activeTab="profile" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 rounded-sm" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-64 rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountNav activeTab="profile" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-canvas border border-hairline/70 rounded-sm p-6 sm:p-8 shadow-luxury"
          aria-label="Edit Profile Form"
        >
          <h2 className="font-display text-step-2 text-ink font-normal mb-1">
            {t('account.profileTitle')}
          </h2>
          <p className="text-[0.8125rem] text-stone font-sans mb-6">
            {t('account.profileSubtitle')}
          </p>

          {saveSuccess && (
            <div
              role="status"
              className="mb-6 border border-gold-leaf/40 bg-gold-leaf/5 px-4 py-3 text-[0.8125rem] text-ink font-sans flex items-center gap-2 rounded-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-leaf flex-shrink-0" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{t('account.profileSavedSuccess')}</span>
            </div>
          )}

          {saveError && (
            <div
              role="alert"
              className="mb-6 border border-oxblood/40 bg-oxblood/5 px-4 py-3 text-[0.8125rem] text-oxblood font-sans rounded-sm"
            >
              {saveError}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <Field
              label={t('account.fullName')}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Layla Al-Mansoor"
              maxLength={100}
            />

            <Field
              label={t('account.emailAddress')}
              name="email"
              type="email"
              value={user?.email || ''}
              disabled
              readOnly
              hint={t('account.emailHelp')}
            />

            <Field
              label={t('account.phoneNumber')}
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('account.phonePlaceholder')}
              maxLength={30}
            />

            {/* Avatar / Portrait Section */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-[0.6875rem] font-sans uppercase tracking-[0.16em] text-stone font-medium">
                  {t('account.avatarLabel')}
                </label>
                <div className="flex items-center gap-2 text-[0.6875rem] font-sans">
                  <button
                    type="button"
                    onClick={() => setAvatarMode('upload')}
                    className={`px-2.5 py-1 rounded-sm transition-colors ${
                      avatarMode === 'upload'
                        ? 'bg-sand/40 text-ink font-medium border border-hairline'
                        : 'text-stone hover:text-ink'
                    }`}
                  >
                    {t('account.uploadPhoto')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('url')}
                    className={`px-2.5 py-1 rounded-sm transition-colors ${
                      avatarMode === 'url'
                        ? 'bg-sand/40 text-ink font-medium border border-hairline'
                        : 'text-stone hover:text-ink'
                    }`}
                  >
                    {t('account.orUseUrl')}
                  </button>
                </div>
              </div>

              {avatarMode === 'upload' ? (
                <div className="flex flex-col gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    data-testid="avatar-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {/* Dropzone & Browse button */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-4 p-4 rounded-sm border-2 border-dashed cursor-pointer transition-all ${
                      isDragging
                        ? 'border-gold-leaf bg-gold-leaf/10'
                        : 'border-hairline/80 hover:border-gold-leaf/60 bg-sand/10 hover:bg-sand/20'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    aria-label={t('account.chooseFile')}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-sand/30 border border-hairline flex items-center justify-center text-stone">
                      {(previewUrl || avatar) && !imgError ? (
                        <img
                          src={previewUrl || getImageUrl(avatar)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-sans text-[0.8125rem] text-ink font-medium">
                        {selectedFile ? selectedFile.name : t('account.chooseFile')}
                      </span>
                      <span className="font-sans text-[0.6875rem] text-stone truncate">
                        {selectedFile
                          ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                          : t('account.formatHint')}
                      </span>
                    </div>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFile();
                        }}
                        className="px-2 py-1 text-[0.6875rem] font-sans text-oxblood hover:underline flex-shrink-0"
                      >
                        {t('account.removeSelectedFile')}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <Field
                  label={t('account.avatarUrl')}
                  name="avatar"
                  type="url"
                  value={avatar}
                  onChange={(e) => {
                    setAvatar(e.target.value);
                    setImgError(false);
                    if (previewUrl) {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }
                  }}
                  placeholder={t('account.avatarPlaceholder')}
                  hint={t('account.avatarHelp')}
                />
              )}
            </div>

            <div className="pt-3 border-t border-hairline/60 flex items-center justify-between">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={updateProfile.isPending || uploadImage.isPending}
              >
                {updateProfile.isPending || uploadImage.isPending ? t('account.saving') : t('account.saveChanges')}
              </Button>
            </div>
          </div>
        </form>

        {/* Patron Dossier Card */}
        <aside
          aria-label="Patron Summary Dossier"
          className="lg:col-span-1 bg-canvas border border-hairline/70 rounded-sm p-6 sm:p-7 shadow-luxury flex flex-col items-center text-center"
        >
          <div className="relative mb-4">
            {(previewUrl || avatar) && !imgError ? (
              <img
                src={previewUrl || getImageUrl(avatar)}
                alt={name || user?.email}
                onError={() => setImgError(true)}
                className="w-24 h-24 rounded-full object-cover border-2 border-gold-leaf/40 shadow-subtle"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-najd text-plaster font-serif text-step-2 flex items-center justify-center font-medium border-2 border-gold-leaf/30 shadow-subtle">
                {initials}
              </div>
            )}
            <span className="absolute bottom-0 end-0 h-4 w-4 rounded-full bg-emerald-700 border-2 border-canvas" title="Active Patron" />
          </div>

          <h3 className="font-display text-step-1 text-ink font-normal leading-snug">
            {name || user?.email?.split('@')[0]}
          </h3>
          <p className="text-[0.75rem] font-sans text-stone mt-0.5 truncate max-w-[200px]">
            {user?.email}
          </p>

          <div className="mt-3 inline-block px-2.5 py-0.5 text-[0.6875rem] font-sans tracking-[0.16em] uppercase font-medium bg-gold-leaf/10 text-gold-leaf border border-gold-leaf/20 rounded-sm">
            {t('account.roleCollector')}
          </div>

          <div className="w-full border-t border-hairline/60 mt-6 pt-5 flex flex-col gap-3 text-start">
            <div className="flex items-center justify-between text-[0.8125rem]">
              <span className="text-stone font-sans">{t('account.memberSince')}</span>
              <span className="font-sans font-medium text-ink">{memberYear}</span>
            </div>
            <div className="flex items-center justify-between text-[0.8125rem]">
              <span className="text-stone font-sans">{t('account.addressesTab')}</span>
              <span className="font-sans font-medium text-ink">{user?.addresses?.length || 0}</span>
            </div>
            <div className="pt-2 border-t border-hairline/40">
              <span className="text-[0.6875rem] tracking-[0.18em] uppercase text-stone block mb-1">
                {t('account.defaultAddress')}
              </span>
              {defaultAddr?.street ? (
                <p className="text-[0.8125rem] text-ink font-sans leading-relaxed">
                  {defaultAddr.street}, {defaultAddr.city}
                  {defaultAddr.country ? `, ${defaultAddr.country}` : ''}
                </p>
              ) : (
                <p className="text-[0.8125rem] text-stone/80 italic font-sans">
                  {t('account.noDefaultAddress')}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
