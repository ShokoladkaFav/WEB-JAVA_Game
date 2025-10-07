import districtsData from '../../data/districtCards.json';

interface DistrictCard {
  id: string;
  name: string;
  category: string;
  cost: number;
  image: string;
  effect?: string;
}

interface DistrictCardsFile {
  districts: DistrictCard[];
}

const data = districtsData as DistrictCardsFile;

// ✅ Пошук картки по ID
export const getCardInfo = (cardId: string): DistrictCard | undefined =>
  data.districts.find((c: DistrictCard) => c.id === cardId);
