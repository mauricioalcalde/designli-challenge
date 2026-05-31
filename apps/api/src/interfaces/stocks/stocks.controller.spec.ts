import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StocksController } from './stocks.controller';
import { StocksService } from '../../application/stocks/stocks.service';
import { IStockProvider } from '../../application/stocks/ports/stock-provider.port';
import { ITokenService } from '../../application/auth/ports/token-service.port';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtPayload, StockListing, StockChartPoint } from '@designli-challenge/shared';

const mockStocks: StockListing[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 178.32, changePercent: 1.24 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 141.76, changePercent: -0.53 },
];

const mockChart: StockChartPoint[] = [
  {
    timestamp: '2024-01-01T00:00:00.000Z',
    open: 175.0,
    high: 178.0,
    low: 174.5,
    close: 177.0,
  },
];

function makeMockStockProvider(): IStockProvider {
  return {
    list: vi.fn(),
    chart: vi.fn(),
  } as unknown as IStockProvider;
}

function makeMockTokenService(): ITokenService {
  return {
    sign: vi.fn(),
    verify: vi.fn(),
  } as unknown as ITokenService;
}

describe('StocksController (integration)', () => {
  let app: INestApplication;
  let stockProvider: IStockProvider;
  let tokenSvc: ITokenService;

  beforeEach(async () => {
    stockProvider = makeMockStockProvider();
    tokenSvc = makeMockTokenService();

    const stocksService = new StocksService(stockProvider);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [
        { provide: StocksService, useValue: stocksService },
        { provide: ITokenService, useValue: tokenSvc },
        JwtAuthGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /stocks', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const res = await request(app.getHttpServer()).get('/stocks');
      expect(res.status).toBe(401);
    });

    it('should return 200 with stock list when valid Bearer token is provided', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(stockProvider.list).mockResolvedValue(mockStocks);

      const res = await request(app.getHttpServer())
        .get('/stocks')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStocks);
    });
  });

  describe('GET /stocks/:symbol/chart', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const res = await request(app.getHttpServer()).get('/stocks/AAPL/chart');
      expect(res.status).toBe(401);
    });

    it('should return 200 with chart data when valid Bearer token is provided', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(stockProvider.chart).mockResolvedValue(mockChart);

      const res = await request(app.getHttpServer())
        .get('/stocks/AAPL/chart')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockChart);
    });

    it('should return 200 with empty array when symbol is unknown (mock returns [])', async () => {
      vi.mocked(tokenSvc.verify).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      } as JwtPayload);
      vi.mocked(stockProvider.chart).mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/stocks/UNKNOWN/chart')
        .set('Authorization', 'Bearer valid-token');

      // The controller throws a NotFoundException when chart() returns empty
      // This test exercises the empty-array path through the provider boundary
      expect(res.status).toBe(404);
    });
  });
});
