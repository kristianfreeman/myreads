import { Form, useActionData } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { redirect } from 'react-router';
import { SimpleAuthService, isAuthenticated } from '~/services/auth-simple';
import { checkRateLimit, getRateLimitKey } from '~/lib/rate-limit';

export const meta: MetaFunction = () => {
  return [
    { title: "Unlock - MyReads" },
    { name: "description", content: "Enter password to access MyReads" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // If already authenticated, redirect to dashboard
  if (isAuthenticated(request)) {
    return redirect('/dashboard');
  }
  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  // Check rate limit
  const rateLimitKey = getRateLimitKey(request, 'unlock');
  const rateLimitResult = await checkRateLimit(context, rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
  
  if (!rateLimitResult.success) {
    const resetIn = Math.ceil((rateLimitResult.reset - Date.now()) / 1000 / 60);
    return { 
      error: `Too many attempts. Please try again in ${resetIn} minutes.`,
      rateLimited: true 
    };
  }

  const formData = await request.formData();
  const password = formData.get('password') as string;
  
  if (!password) {
    return { error: 'Password is required' };
  }

  try {
    const authService = new SimpleAuthService(context);
    const isValid = await authService.verifyPassword(password);
    
    if (!isValid) {
      return { 
        error: `Invalid password. ${rateLimitResult.remaining} attempts remaining.`,
        remaining: rateLimitResult.remaining 
      };
    }
    
    const authCookie = authService.createAuthCookie();
    
    return redirect('/dashboard', {
      headers: {
        'Set-Cookie': authCookie,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    if (error instanceof Error && error.message.includes('not configured')) {
      return { error: 'Application not configured. Please follow the setup instructions to set the APP_PASSWORD secret.' };
    }
    return { error: 'Authentication failed' };
  }
}

export default function Unlock() {
  const actionData = useActionData<typeof action>();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">MyReads</h1>
          <h2 className="mt-6 text-center text-xl text-gray-600 dark:text-gray-400">
            Enter Password
          </h2>
        </div>
        <Form method="post" className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 focus:z-10 sm:text-sm"
              placeholder="Enter password"
              autoFocus
            />
          </div>

          {actionData?.error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {actionData.error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
            >
              Unlock
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}