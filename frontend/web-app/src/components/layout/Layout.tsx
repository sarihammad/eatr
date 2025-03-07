import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@/styles/theme';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ChakraProvider theme={theme}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </ChakraProvider>
  );
} 