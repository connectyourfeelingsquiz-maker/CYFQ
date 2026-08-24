import './globals.css';

export const metadata = {
  title: 'CYFQ | Connect Your Feelings Quiz',
  description: 'Explore your emotional awareness with CYFQ.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
