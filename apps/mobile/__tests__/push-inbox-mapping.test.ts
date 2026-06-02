import type { AddNotificationInput } from '../src/application/inbox.store';

// ---------------------------------------------------------------------------
// RED phase — tests for notification payload → inbox mapper
// The function mapPushToInboxInput does NOT exist yet
// ---------------------------------------------------------------------------

describe('push notification → inbox mapper', () => {
  describe('mapPushToInboxInput', () => {
    it('maps a full alert notification payload with symbol and alertId', () => {
      const payload = {
        title: 'Price Alert',
        body: 'AAPL crossed $180',
        data: { symbol: 'AAPL', alertId: '5' },
      };

      // Function does not exist yet — will be created in GREEN phase
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mapPushToInboxInput } = require('../src/presentation/utils/push-mapping');

      const result = mapPushToInboxInput(payload);

      expect(result).toEqual<AddNotificationInput>({
        title: 'Price Alert',
        body: 'AAPL crossed $180',
        type: 'alert',
        symbol: 'AAPL',
        alertId: 5,
      });
    });

    it('defaults missing title to "Notification"', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mapPushToInboxInput } = require('../src/presentation/utils/push-mapping');

      const result = mapPushToInboxInput({ body: 'Something happened', data: {} });

      expect(result.title).toBe('Notification');
      expect(result.body).toBe('Something happened');
      expect(result.type).toBe('alert');
    });

    it('defaults missing body to empty string', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mapPushToInboxInput } = require('../src/presentation/utils/push-mapping');

      const result = mapPushToInboxInput({ title: 'System Update', data: {} });

      expect(result.title).toBe('System Update');
      expect(result.body).toBe('');
    });

    it('handles completely empty payload', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mapPushToInboxInput } = require('../src/presentation/utils/push-mapping');

      const result = mapPushToInboxInput({});

      expect(result).toEqual<AddNotificationInput>({
        title: 'Notification',
        body: '',
        type: 'alert',
        symbol: undefined,
        alertId: undefined,
      });
    });

    it('converts string alertId to number', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mapPushToInboxInput } = require('../src/presentation/utils/push-mapping');

      const result = mapPushToInboxInput({
        title: 'Alert',
        body: 'Test',
        data: { alertId: '42' },
      });

      expect(result.alertId).toBe(42);
      expect(typeof result.alertId).toBe('number');
    });

    it('handles missing data object', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mapPushToInboxInput } = require('../src/presentation/utils/push-mapping');

      const result = mapPushToInboxInput({ title: 'Alert', body: 'Test' });

      expect(result.symbol).toBeUndefined();
      expect(result.alertId).toBeUndefined();
    });
  });
});
