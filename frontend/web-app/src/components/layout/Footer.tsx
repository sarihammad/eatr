import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';

const ListHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
      {children}
    </Text>
  );
};

export default function Footer() {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
    >
      <Container as={Stack} maxW={'6xl'} py={10}>
        <SimpleGrid
          templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }}
          spacing={8}
        >
          <Stack spacing={6}>
            <Box>
              <Text fontSize={'lg'} fontWeight="bold">
                Eatr
              </Text>
            </Box>
            <Text fontSize={'sm'}>
              © {new Date().getFullYear()} Eatr. All rights reserved
            </Text>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Company</ListHeader>
            <Link href={'/about'}>About Us</Link>
            <Link href={'/blog'}>Blog</Link>
            <Link href={'/careers'}>Careers</Link>
            <Link href={'/contact'}>Contact Us</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Support</ListHeader>
            <Link href={'/help'}>Help Center</Link>
            <Link href={'/safety'}>Safety Center</Link>
            <Link href={'/community'}>Community Guidelines</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Legal</ListHeader>
            <Link href={'/cookies'}>Cookies Policy</Link>
            <Link href={'/privacy'}>Privacy Policy</Link>
            <Link href={'/terms'}>Terms of Service</Link>
            <Link href={'/law-enforcement'}>Law Enforcement</Link>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
