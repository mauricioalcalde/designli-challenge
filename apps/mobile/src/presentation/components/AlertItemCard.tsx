import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AlertDirection } from '@designli-challenge/shared';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { useTheme } from '../theme/useTheme';
import { formatRelativeTime } from '../utils/time-format';

export type AlertItemStatus = 'active' | 'triggered' | 'pending' | 'failed';

interface AlertItemCardProps {
  symbol: string;
  companyName?: string;
  currentPrice?: number;
  targetPrice: number;
  direction: AlertDirection;
  status: AlertItemStatus;
  timestamp?: string;
  onDelete: () => void;
  isDeleting?: boolean;
  errorMessage?: string;
  testID?: string;
  deleteTestID?: string;
}

function getStatusConfig(status: AlertItemStatus): {
  label: string;
  variant: 'success' | 'warning' | 'error';
} {
  switch (status) {
    case 'triggered':
      return { label: 'Triggered', variant: 'warning' };
    case 'pending':
      return { label: 'Pending sync', variant: 'warning' };
    case 'failed':
      return { label: 'Sync failed', variant: 'error' };
    case 'active':
    default:
      return { label: 'Active', variant: 'success' };
  }
}

function formatTargetPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDirection(direction: AlertDirection): string {
  return direction === 'above' ? 'Above' : 'Below';
}

function getCompanyLogo(symbol: string): keyof typeof Ionicons.glyphMap | null {
  switch (symbol.toUpperCase()) {
    case 'AAPL':
      return 'logo-apple';
    case 'GOOGL':
    case 'GOOG':
      return 'logo-google';
    case 'AMZN':
      return 'logo-amazon';
    case 'MSFT':
      return 'logo-microsoft';
    case 'TSLA':
      return 'flash-outline';
    default:
      return null;
  }
}

export function AlertItemCard({
  symbol,
  companyName,
  currentPrice,
  targetPrice,
  direction,
  status,
  timestamp,
  onDelete,
  isDeleting = false,
  errorMessage,
  testID,
  deleteTestID,
}: AlertItemCardProps) {
  const { tokens } = useTheme();
  const statusConfig = getStatusConfig(status);
  const logo = getCompanyLogo(symbol);

  return (
    <Card testID={testID}>
      <View style={styles.header}>
        <View style={styles.leftSide}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: tokens.colors.bg.elevated,
                borderColor: tokens.colors.border.subtle,
              },
            ]}
          >
            {logo ? (
              <Ionicons name={logo} size={20} color={tokens.colors.text.primary} />
            ) : (
              <Text style={[styles.avatarLabel, { color: tokens.colors.text.primary }]}>
                {symbol.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.identity}>
            <Text style={[styles.symbol, { color: tokens.colors.text.primary }]}>{symbol}</Text>
            <Text style={[styles.company, { color: tokens.colors.text.secondary }]}>
              {companyName ?? `${symbol} alert`}
            </Text>
            <Text style={[styles.direction, { color: tokens.colors.text.primary }]}>
              {formatDirection(direction)} {formatTargetPrice(targetPrice)}
            </Text>
            {typeof currentPrice === 'number' ? (
              <Text style={[styles.currentPrice, { color: tokens.colors.text.secondary }]}>
                Current price ${currentPrice.toFixed(2)}
              </Text>
            ) : null}
            {timestamp ? (
              <Text
                style={[styles.timestamp, { color: tokens.colors.text.muted }]}
                testID={testID ? `${testID}-timestamp` : 'alert-item-timestamp'}
              >
                {status === 'triggered'
                  ? `Triggered ${formatRelativeTime(timestamp)}`
                  : formatRelativeTime(timestamp)}
              </Text>
            ) : null}
          </View>
        </View>

        <Badge text={statusConfig.label} variant={statusConfig.variant} />
      </View>

      {errorMessage ? (
        <Text style={[styles.error, { color: tokens.colors.error }]}>{errorMessage}</Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={isDeleting ? 'Deleting...' : 'Delete'}
          variant="outline"
          onPress={onDelete}
          disabled={isDeleting}
          testID={deleteTestID ?? (testID ? `${testID}-delete` : 'alert-item-delete')}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  leftSide: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  symbol: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  company: {
    fontSize: 14,
    lineHeight: 20,
  },
  direction: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: 13,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    lineHeight: 16,
  },
  error: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
});
