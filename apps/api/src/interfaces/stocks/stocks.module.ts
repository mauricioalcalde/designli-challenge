import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { StocksService } from '../../application/stocks/stocks.service';
import { IStockProvider } from '../../application/stocks/ports/stock-provider.port';
import { MockStockProvider } from '../../infrastructure/stocks/mock-stock.provider';
import { FinnhubStockProvider } from '../../infrastructure/stocks/finnhub-stock.provider';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

function createFinnhubProvider() {
  const apiKey = process.env['FINNHUB_API_KEY'];
  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY environment variable is required for stock data');
  }

  return new FinnhubStockProvider(apiKey);
}

@Module({
  imports: [AuthModule],
  controllers: [StocksController],
  providers: [
    StocksService,
    JwtAuthGuard,
    {
      provide: IStockProvider,
      useFactory: () => {
        const provider = process.env['STOCK_PROVIDER'] ?? 'finnhub';
        if (provider === 'mock') {
          return new MockStockProvider();
        }

        return createFinnhubProvider();
      },
    },
  ],
})
export class StocksModule {}
