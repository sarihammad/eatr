import { Box, Image, Badge, Text, Stack, useColorModeValue } from '@chakra-ui/react';
import Link from 'next/link';
import { Restaurant } from '@/types/restaurant';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const {
    id,
    name,
    cuisine,
    imageUrl,
    rating,
    priceRange,
    deliveryTime,
    isOpen,
  } = restaurant;

  return (
    <Link href={`/restaurants/${id}`}>
      <Box
        maxW="sm"
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={useColorModeValue('white', 'gray.800')}
        transition="transform 0.2s"
        _hover={{ transform: 'scale(1.02)' }}
        cursor="pointer"
      >
        <Image
          src={imageUrl}
          alt={name}
          height="200px"
          width="100%"
          objectFit="cover"
        />

        <Box p="6">
          <Box display="flex" alignItems="baseline">
            <Badge
              borderRadius="full"
              px="2"
              colorScheme={isOpen ? 'green' : 'red'}
            >
              {isOpen ? 'Open' : 'Closed'}
            </Badge>
            <Box
              color={useColorModeValue('gray.500', 'gray.400')}
              fontWeight="semibold"
              letterSpacing="wide"
              fontSize="xs"
              textTransform="uppercase"
              ml="2"
            >
              {cuisine}
            </Box>
          </Box>

          <Box
            mt="1"
            fontWeight="semibold"
            as="h4"
            lineHeight="tight"
            noOfLines={1}
          >
            {name}
          </Box>

          <Stack direction="row" mt={2} spacing={2}>
            <Badge colorScheme="yellow">⭐ {rating}</Badge>
            <Badge colorScheme="purple">{priceRange}</Badge>
            <Badge colorScheme="blue">{deliveryTime} min</Badge>
          </Stack>
        </Box>
      </Box>
    </Link>
  );
} 