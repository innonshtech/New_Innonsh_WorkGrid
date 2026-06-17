import { redirect } from 'next/navigation';

export default function ESSRedirect() {
  redirect('/admin/profile');
}
