import { SampleWarehouse } from '../types';

export const SAMPLE_WAREHOUSES: SampleWarehouse[] = [
  {
    id: 'SAMPLE-3',
    name: 'Rocket Launches',
    description: 'A comprehensive database tracking global rocket launches, including data from various space agencies and private companies. Contains detailed information about launch vehicles, missions, payloads, and success rates over time.',
    schema: 'space'
  },
  {
    id: 'SAMPLE-1',
    name: 'Conglomerate',
    description: 'An algorithmically-generated sample database (100+ tables) of a large, multinational company. It operates across a variety of sectors: chemical and furniture manufacturing; retail; transportation; finance; data; CRMs; gaming; food; medical devices and hospitals; farming; and utilities.',
    schema: 'public'
  },
  {
    id: 'SAMPLE-2',
    name: 'Ticket Selling Business',
    description: 'A sample database (7 tables) of a small ticket-selling business. Its data comprises venues, events, and sales.',
    schema: 'tickit'
  },
  {
    id: 'SAMPLE-4',
    name: 'Meteorite Landings',
    description: 'An extensive dataset of meteorite falls and finds across the globe, including detailed information about their mass, composition, classification, and discovery circumstances.',
    schema: 'meteorites'
  },
  {
    id: 'SAMPLE-5',
    name: 'Electric Vehicles',
    description: 'A detailed database of electric vehicle adoption in the United States, including purchase patterns, ownership statistics, charging infrastructure data, and vehicle specifications across different manufacturers and models.',
    schema: 'vehicles'
  }
];