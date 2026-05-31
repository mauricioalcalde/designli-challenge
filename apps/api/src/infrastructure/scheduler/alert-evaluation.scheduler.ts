import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AlertEvaluatorService } from '../../application/alerts/alert-evaluator.service';

/**
 * Infrastructure-only scheduler. Business logic lives in AlertEvaluatorService
 * (application layer, zero framework imports). This class is a thin 20-line
 * trigger that prevents overlapping evaluations via an isEvaluating guard.
 */
@Injectable()
export class AlertEvaluationScheduler {
  private isEvaluating = false;

  constructor(
    @Inject(AlertEvaluatorService)
    private readonly evaluator: AlertEvaluatorService,
  ) {}

  @Cron('*/30 * * * * *')
  async run(): Promise<void> {
    if (this.isEvaluating) return;

    this.isEvaluating = true;
    try {
      await this.evaluator.evaluateAll();
    } catch (error) {
      console.error('[AlertEvaluationScheduler] Evaluation cycle failed:', error);
    } finally {
      this.isEvaluating = false;
    }
  }
}
