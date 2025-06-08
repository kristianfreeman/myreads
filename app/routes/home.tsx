import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { isAuthenticated } from '~/services/auth-simple';

export function loader({ request }: LoaderFunctionArgs) {
  if (isAuthenticated(request)) {
    return redirect('/dashboard');
  }
  return redirect('/unlock');
}
