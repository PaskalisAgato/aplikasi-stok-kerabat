/**
 * apps/shared/authClient.ts
 * Better Auth React client singleton for the Kerabat POS monorepo.
 *
 * Provides:
 *   - `authClient.signIn.email({ email, password })` — login
 *   - `authClient.signOut()` — logout
 *   - `authClient.useSession()` — reactive session hook (React hook)
 *   - `authClient.getSession()` — imperative session fetch
 */
import { createAuthClient } from 'better-auth/react';
export declare const authClient: ReturnType<typeof createAuthClient>;
export declare const getSession: () => Promise<{
    data: any;
    error: null;
} | {
    data: null;
    error: any;
}>;
export declare function useSession(): {
    data: any;
    isPending: boolean;
    refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<any, Error>>;
    error: Error | null;
};
export declare const signIn: {
    social: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        provider: (string & {}) | "linear" | "huggingface" | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "railway" | "vercel" | "wechat";
        callbackURL?: string | undefined;
        newUserCallbackURL?: string | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            expiresAt?: number | undefined;
            user?: {
                name?: {
                    firstName?: string | undefined;
                    lastName?: string | undefined;
                } | undefined;
                email?: string | undefined;
            } | undefined;
        } | undefined;
        scopes?: string[] | undefined;
        requestSignUp?: boolean | undefined;
        loginHint?: string | undefined;
        additionalData?: Record<string, any> | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        provider: (string & {}) | "linear" | "huggingface" | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "railway" | "vercel" | "wechat";
        callbackURL?: string | undefined;
        newUserCallbackURL?: string | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            expiresAt?: number | undefined;
            user?: {
                name?: {
                    firstName?: string | undefined;
                    lastName?: string | undefined;
                } | undefined;
                email?: string | undefined;
            } | undefined;
        } | undefined;
        scopes?: string[] | undefined;
        requestSignUp?: boolean | undefined;
        loginHint?: string | undefined;
        additionalData?: Record<string, any> | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        redirect: boolean;
        url: string;
    } | (Omit<{
        redirect: boolean;
        token: string;
        url: undefined;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        };
    }, "user"> & {
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
    }), {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    email: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        email: string;
        password: string;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        email: string;
        password: string;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<Omit<{
        redirect: boolean;
        token: string;
        url?: string | undefined;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        };
    }, "user"> & {
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
}, signOut: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
    query?: Record<string, any> | undefined;
    fetchOptions?: FetchOptions | undefined;
}> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
    success: boolean;
}, {
    code?: string | undefined;
    message?: string | undefined;
}, FetchOptions["throw"] extends true ? true : false>>;
