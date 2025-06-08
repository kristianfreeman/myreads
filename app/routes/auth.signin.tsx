import { Form, Link } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { json, redirect } from 'react-router';
import { AuthService, createSessionCookie } from '~/services/auth';
import { signInSchema } from '~/lib/validation';
import { z } from 'zod';

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  try {
    const validatedData = signInSchema.parse(data);
    const authService = new AuthService(context);
    
    const user = await authService.verifyCredentials(
      validatedData.username,
      validatedData.password
    );
    
    if (!user) {
      return json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    const session = await authService.createSession(user.id);
    const sessionCookie = createSessionCookie(session.id);
    
    return redirect('/dashboard', {
      headers: {
        'Set-Cookie': sessionCookie,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    return json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>
        <Form method="post" className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}