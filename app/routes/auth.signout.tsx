import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { AuthService, destroySessionCookie } from '~/services/auth';

export async function action({ request, context }: ActionFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = cookieHeader?.match(/session=([^;]+)/)?.[1];

  if (sessionId) {
    const authService = new AuthService(context);
    await authService.deleteSession(sessionId);
  }

  return redirect('/', {
    headers: {
      'Set-Cookie': destroySessionCookie(),
    },
  });
}

export function loader() {
  return redirect('/');
}