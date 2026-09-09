export const promos = [
  {
    code: 'YANGI20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 20000,
    description: "20% chegirma (kamida 20 000 so'm)",
    isActive: true,
  },
  {
    code: 'QAPP10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
    description: "10% chegirma (chegarasiz)",
    isActive: true,
  },
  {
    code: 'BEPUL',
    discountType: 'FIXED',
    discountValue: 5000,
    minOrderAmount: 0,
    description: "Yetkazib berish uchun 5 000 so'm chegirma",
    isActive: true,
  },
];

export default promos;
