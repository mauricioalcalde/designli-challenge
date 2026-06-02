import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service';

type PrismaServiceDouble = PrismaService & {
  $connect: ReturnType<typeof vi.fn>;
  $disconnect: ReturnType<typeof vi.fn>;
};

describe('PrismaService lifecycle', () => {
  it('connects the generated Prisma client on module init', async () => {
    const service = Object.create(PrismaService.prototype) as PrismaServiceDouble;
    service.$connect = vi.fn().mockResolvedValue(undefined);

    await PrismaService.prototype.onModuleInit.call(service);

    expect(service.$connect).toHaveBeenCalledTimes(1);
  });

  it('disconnects the generated Prisma client on module destroy', async () => {
    const service = Object.create(PrismaService.prototype) as PrismaServiceDouble;
    service.$disconnect = vi.fn().mockResolvedValue(undefined);

    const onModuleDestroy = (PrismaService.prototype as PrismaServiceDouble).onModuleDestroy;

    expect(onModuleDestroy).toBeTypeOf('function');

    await onModuleDestroy.call(service);

    expect(service.$disconnect).toHaveBeenCalledTimes(1);
  });
});
