import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
  ServiceUnavailableException,
} from '@nestjs/common';
import { StockListing, StockChartPoint } from '@designli-challenge/shared';
import { StocksService } from '../../application/stocks/stocks.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { StockProviderError } from '../../application/stocks/stock-provider.error';

@Controller('stocks')
@UseGuards(JwtAuthGuard)
export class StocksController {
  constructor(@Inject(StocksService) private readonly stocksService: StocksService) {}

  @Get()
  async list(): Promise<StockListing[]> {
    try {
      return await this.stocksService.list();
    } catch (error) {
      if (error instanceof StockProviderError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }

  @Get(':symbol/chart')
  async chart(
    @Param('symbol') symbol: string,
    @Query('range') range?: string,
  ): Promise<StockChartPoint[]> {
    try {
      return await this.stocksService.chart(symbol, range ?? '1W');
    } catch (error) {
      if (error instanceof StockProviderError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }
}
