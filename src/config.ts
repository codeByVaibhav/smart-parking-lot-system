import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  dbUrl: process.env.DATABASE_URL || 'file:./dev.db',
  fee: {
    MOTORCYCLE: {
      base: parseInt(process.env.BASE_FEE_MOTORCYCLE || '50', 10),
      perHour: parseInt(process.env.FEE_MOTORCYCLE_PER_HOUR || '100', 10),
    },
    CAR: {
      base: parseInt(process.env.BASE_FEE_CAR || '100', 10),
      perHour: parseInt(process.env.FEE_CAR_PER_HOUR || '200', 10),
    },
    BUS: {
      base: parseInt(process.env.BASE_FEE_BUS || '200', 10),
      perHour: parseInt(process.env.FEE_BUS_PER_HOUR || '500', 10),
    },
  },
} as const;
