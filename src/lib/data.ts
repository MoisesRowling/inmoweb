import type { Property } from './types';

// This data is now used to seed the database
export const propertiesData: Omit<Property, 'invested' | 'initialInvestment' | 'ownedShares' | 'investmentTerm'>[] = [
  {
    id: '1',
    name: 'Hacienda Santorini',
    location: 'Playa del Carmen, Quintana Roo',
    type: 'Hacienda',
    price: 4500000,
    minInvestment: 300,
    totalShares: 15000,
    image: 'hacienda-santorini',
    dailyReturn: 0.001,
  },
  {
    id: '2',
    name: 'Casa Monaco',
    location: 'Monterrey, Nuevo León',
    type: 'Casa',
    price: 3800000,
    minInvestment: 500,
    totalShares: 7600,
    image: 'casa-monaco',
    dailyReturn: 0.0011,
  },
  {
    id: '3',
    name: 'Residencia Ejecutiva',
    location: 'Santa Fe, Ciudad de México',
    type: 'Residencia',
    price: 6200000,
    minInvestment: 700,
    totalShares: 8857,
    image: 'residencia-ejecutiva',
    dailyReturn: 0.0012,
  },
  {
    id: '4',
    name: 'Loft Esmeralda',
    location: 'Guadalajara, Jalisco',
    type: 'Loft',
    price: 2500000,
    minInvestment: 250,
    totalShares: 10000,
    image: 'casa-esmeralda',
    dailyReturn: 0.0009,
  }
];
