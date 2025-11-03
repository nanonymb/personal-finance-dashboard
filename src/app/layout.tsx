import { ReactNode } from 'react';
import ClientLayout from './client-layout';

export const metadata = {
  title: 'Finance Dashboard',
  description: 'A desktop finance management app',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}