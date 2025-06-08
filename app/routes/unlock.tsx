import { Form, useActionData } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { SimpleAuthService, isAuthenticated } from '~/services/auth-simple';

export async function loader({ request }: LoaderFunctionArgs) {
  // If already authenticated, redirect to dashboard
  if (isAuthenticated(request)) {
    return redirect('/dashboard');
  }
  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = formData.get('password') as string;
  
  if (!password) {
    return { error: 'Password is required' };
  }

  try {
    const authService = new SimpleAuthService(context);
    const isValid = await authService.verifyPassword(password);
    
    if (!isValid) {
      return { error: 'Invalid password' };
    }
    
    const authCookie = authService.createAuthCookie();
    
    return redirect('/dashboard', {
      headers: {
        'Set-Cookie': authCookie,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return { error: 'Authentication failed' };
  }
}

export default function Unlock() {
  const actionData = useActionData<typeof action>();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">MyReads</h1>
          <h2 className="mt-6 text-center text-xl text-gray-600">
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
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter password"
              autoFocus
            />
          </div>

          {actionData?.error && (
            <div className="text-red-600 text-sm text-center">
              {actionData.error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Unlock
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-500">
            Default password: "password" (change in production)
          </p>
        </Form>
      </div>
    </div>
  );
}