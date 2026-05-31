import { Injectable, Inject } from '@nestjs/common';
import { StockListing, StockChartPoint } from '@designli-challenge/shared';
import { IStockProvider } from './ports/stock-provider.port';

@Injectable()
export class StocksService {
  constructor(
    @Inject(IStockProvider) private readonly stockProvider: IStockProvider,
  ) {}

  async list(): Promise<StockListing[]> {
    return this.stockProvider.list();
  }

  async chart(symbol: string, range = '1W'): Promise<StockChartPoint[]> {
    return this.stockProvider.chart(symbol, range);
  }
}
