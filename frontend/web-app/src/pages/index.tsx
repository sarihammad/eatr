import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import Layout from '@/components/layout/Layout';
import RestaurantCard from '@/components/restaurant/RestaurantCard';
import { useRestaurants } from '@/hooks/useRestaurants';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const { restaurants, isLoading } = useRestaurants(searchQuery);

  return (
    <Layout>
      <Box
        bg={useColorModeValue('gray.50', 'gray.900')}
        minH="calc(100vh - 60px)"
      >
        {/* Hero Section */}
        <Box bg={useColorModeValue('primary.500', 'primary.200')} py={20}>
          <Container maxW="container.xl">
            <Heading
              as="h1"
              size="2xl"
              color={useColorModeValue('white', 'gray.800')}
              mb={4}
            >
              Food delivery and more
            </Heading>
            <Text
              fontSize="xl"
              color={useColorModeValue('white', 'gray.800')}
              mb={8}
            >
              Discover the best food and drinks in your area
            </Text>
            <InputGroup maxW="600px" bg="white" borderRadius="lg">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                type="text"
                placeholder="Search for restaurants or cuisines"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="lg"
                bg="white"
                border="none"
                _focus={{
                  boxShadow: 'outline',
                }}
              />
            </InputGroup>
          </Container>
        </Box>

        {/* Restaurants Grid */}
        <Container maxW="container.xl" py={12}>
          <Heading as="h2" size="xl" mb={8}>
            Popular Restaurants
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 6 }).map((_, i) => (
                <Box
                  key={i}
                  height="300px"
                  bg={useColorModeValue('gray.100', 'gray.700')}
                  borderRadius="lg"
                  animation="pulse 2s infinite"
                />
              ))
            ) : restaurants?.length ? (
              restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))
            ) : (
              <Text>No restaurants found</Text>
            )}
          </SimpleGrid>
        </Container>
      </Box>
    </Layout>
  );
} 