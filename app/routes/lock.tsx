import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { SimpleAuthService } from '~/services/auth-simple';

export async function action({ context }: ActionFunctionArgs) {
  const authService = new SimpleAuthService(context);
  
  return redirect('/', {
    headers: {
      'Set-Cookie': authService.destroyAuthCookie(),
    },
  });
}

export function loader() {
  return redirect('/');
}