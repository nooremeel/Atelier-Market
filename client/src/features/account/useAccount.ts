import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '../../lib/api';
import { useAuth } from '../../auth/AuthProvider';
import type { SessionUser, AddressBookItem, UpdateProfilePayload, AddressPayload } from '../../types';

export function useAccountProfile() {
  return useQuery<{ user: SessionUser }>({
    queryKey: ['account', 'profile'],
    queryFn: () => apiGet<{ user: SessionUser }>('/api/account/profile'),
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiUpload<{ imageUrl: string }>('/api/upload', 'POST', formData);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload | FormData) => {
      if (payload instanceof FormData) {
        return apiUpload<{ user: SessionUser }>('/api/account/profile', 'PATCH', payload);
      }
      return apiPatch<{ user: SessionUser }>('/api/account/profile', payload);
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['account', 'profile'], data);
      queryClient.invalidateQueries({ queryKey: ['account', 'profile'] });
    },
  });
}

export function useAddressBook() {
  return useQuery<{ addresses: AddressBookItem[] }>({
    queryKey: ['account', 'addresses'],
    queryFn: () => apiGet<{ addresses: AddressBookItem[] }>('/api/account/addresses'),
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddressPayload) =>
      apiPost<{ address: AddressBookItem; addresses: AddressBookItem[] }>('/api/account/addresses', payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['account', 'addresses'], { addresses: data.addresses });
      queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });
      queryClient.invalidateQueries({ queryKey: ['account', 'profile'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, ...payload }: AddressPayload & { addressId: string }) =>
      apiPatch<{ address: AddressBookItem; addresses: AddressBookItem[] }>(`/api/account/addresses/${addressId}`, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['account', 'addresses'], { addresses: data.addresses });
      queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });
      queryClient.invalidateQueries({ queryKey: ['account', 'profile'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) =>
      apiDelete<{ message: string; addresses: AddressBookItem[] }>(`/api/account/addresses/${addressId}`),
    onSuccess: (data) => {
      queryClient.setQueryData(['account', 'addresses'], { addresses: data.addresses });
      queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });
      queryClient.invalidateQueries({ queryKey: ['account', 'profile'] });
    },
  });
}
