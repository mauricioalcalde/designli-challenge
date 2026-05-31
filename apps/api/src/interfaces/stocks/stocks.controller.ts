import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { StockListing, StockChartPoint } from '@designli-challenge/shared';
import { StocksService } from '../../application/stocks/stocks.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { StockProviderError } from '../../application/stocks/stock-provider.error';

class NotFoundError extends Error {
  constructor(public readonly symbol: string) {
    super(`Stock symbol ${symbol} not found`);
    this.name = 'NotFoundError';
  }

  toHttpException(): NotFoundException {
    return new NotFoundException(this.message);
  }
}

@Controller('stocks')
@UseGuards(JwtAuthGuard)
export class StocksController {
  constructor(
    @Inject(StocksService) private readonly stocksService: StocksService,
  ) {}

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
      const points = await this.stocksService.chart(symbol, range ?? '1W');
      if (points.length === 0) {
        // Return empty array for unknown symbols — controller delegates
        // the 404 decision to the service via an explicit check
        throw new NotFoundError(symbol);
      }
      return points;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error.toHttpException();
      }
      if (error instanceof StockProviderError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }
}
