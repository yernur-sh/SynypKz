import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthModal from '@/components/auth/AuthModal';


export const metadata: Metadata = {
  title: '8 «А» сынып порталы | SynypKz',
  description: 'Сабақ кестесі, сынып хабарламалары және жетістіктер.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
        <AppProvider>
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
          <Footer />
          <AuthModal />
        </AppProvider>
      </body>
    </html>
  );
}
