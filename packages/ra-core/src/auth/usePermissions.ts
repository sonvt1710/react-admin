import { useEffect } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import useAuthProvider from './useAuthProvider';
import useLogoutIfAccessDenied from './useLogoutIfAccessDenied';

const emptyParams = {};

/**
 * Hook for getting user permissions
 *
 * Calls the authProvider.getPermissions() method using react-query.
 * If the authProvider returns a rejected promise, returns empty permissions.
 *
 * The return value updates according to the request state:
 *
 * - start: { isLoading: true }
 * - success: { permissions: [any], isLoading: false }
 * - error: { error: [error from provider], isLoading: false }
 *
 * Useful to enable features based on user permissions
 *
 * @param {Object} params Any params you want to pass to the authProvider
 *
 * @returns The current auth check state. Destructure as { permissions, error, isLoading, refetch }.
 *
 * @example
 *     import { usePermissions } from 'react-admin';
 *
 *     const PostDetail = props => {
 *         const { isLoading, permissions } = usePermissions();
 *         if (!isLoading && permissions == 'editor') {
 *             return <PostEdit {...props} />
 *         } else {
 *             return <PostShow {...props} />
 *         }
 *     };
 */
const usePermissions = <Permissions = any>(
    params = emptyParams,
    queryParams: UsePermissionsOptions<Permissions> = {
        staleTime: 5 * 60 * 1000,
    }
) => {
    const authProvider = useAuthProvider();
    const logoutIfAccessDenied = useLogoutIfAccessDenied();
    const { onSuccess, onError, ...queryOptions } = queryParams ?? {};

    const result = useQuery({
        queryKey: ['auth', 'getPermissions', params],
        queryFn: () => {
            return authProvider
                ? authProvider.getPermissions(params)
                : Promise.resolve([]);
        },
        ...queryOptions,
    });

    useEffect(() => {
        if (result.data && onSuccess) {
            onSuccess(result.data);
        }
    }, [onSuccess, result.data]);

    useEffect(() => {
        if (result.error) {
            if (onError) {
                return onError(result.error);
            }
            if (process.env.NODE_ENV === 'development') {
                console.error(result.error);
            }
            logoutIfAccessDenied(result.error);
        }
    }, [logoutIfAccessDenied, onError, result.error]);

    return result;
};

export default usePermissions;

export interface UsePermissionsOptions<Permissions>
    extends Omit<UseQueryOptions<Permissions>, 'queryKey' | 'queryFn'> {
    onSuccess?: (data: Permissions) => void;
    onError?: (err: Error) => void;
}
