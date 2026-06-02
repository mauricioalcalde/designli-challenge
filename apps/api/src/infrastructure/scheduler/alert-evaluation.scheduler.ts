import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AlertEvaluatorService } from '../../application/alerts/alert-evaluator.service';

/**
 * Infrastructure-only scheduler. Business logic lives in AlertEvaluatorService
 * (application layer, zero framework imports). This class is a thin 20-line
 * trigger that prevents overlapping evaluations via an isEvaluating guard.
 */
@Injectable()
export class AlertEvaluationScheduler {
  private readonly logger = new Logger(AlertEvaluationScheduler.name);
  private isEvaluating = false;

  constructor(
    @Inject(AlertEvaluatorService)
    private readonly evaluator: AlertEvaluatorService,
  ) {
    this.logger.log('Alert evaluation scheduler initialized');
  }

  @Cron('*/30 * * * * *')
  async run(): Promise<void> {
    if (this.isEvaluating) {
      this.logger.warn('Previous evaluation still running, skipping this cycle');
      return;
    }

    this.logger.log('Starting scheduled evaluation cycle');
    this.isEvaluating = true;
    try {
      await this.evaluator.evaluateAll();
      this.logger.log('Scheduled evaluation cycle completed');
    } catch (error) {
      this.logger.error('Evaluation cycle failed:', error);
    } finally {
      this.isEvaluating = false;
    }
  }
}
