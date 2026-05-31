import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../application/auth/ports/user-repository.port';
import { User } from '../../domain/auth/user.entity';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async save(user: User): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: { id: number; email: string; passwordHash: string; createdAt: Date }): User {
    return new User(record.id, record.email, record.passwordHash, record.createdAt);
  }
}
