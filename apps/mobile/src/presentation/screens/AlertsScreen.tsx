import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AlertDirection } from '@designli-challenge/shared';
import { useAlertsStore, useStocksStore } from '../../data/container';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { Skeleton } from '../components/Skeleton';
import { useTheme } from '../theme/useTheme';

interface FieldErrors {
  symbol?: string;
  threshold?: string;
}

function formatThreshold(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDirection(direction: 'above' | 'below'): string {
  return direction === 'above' ? 'Above' : 'Below';
}

export function AlertsScreen() {
  const [symbol, setSymbol] = useState('');
  const [threshold, setThreshold] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const items = useAlertsStore((state) => state.items);
  const isLoading = useAlertsStore((state) => state.isLoading);
  const isSubmitting = useAlertsStore((state) => state.isSubmitting);
  const deletingIds = useAlertsStore((state) => state.deletingIds);
  const error = useAlertsStore((state) => state.error);
  const submitError = useAlertsStore((state) => state.submitError);
  const deleteErrors = useAlertsStore((state) => state.deleteErrors);
  const load = useAlertsStore((state) => state.load);
  const create = useAlertsStore((state) => state.create);
  const remove = useAlertsStore((state) => state.remove);
  const stocks = useStocksStore((state) => state.items);

  const { tokens } = useTheme();

  const suggestions = useMemo(() => {
    const normalizedSymbol = symbol.trim().toUpperCase();

    return stocks
      .filter((stock) => {
        if (!normalizedSymbol) {
          return true;
        }
        return (
          stock.symbol.includes(normalizedSymbol) ||
          stock.name.toUpperCase().includes(normalizedSymbol)
        );
      })
      .slice(0, 4);
  }, [stocks, symbol]);

  useEffect(() => {
    void load();
  }, [load]);

  function validate(): boolean {
    const nextErrors: FieldErrors = {};

    if (!symbol.trim()) {
      nextErrors.symbol = 'Symbol is required';
    }

    const parsedThreshold = Number(threshold);
    if (!threshold.trim() || Number.isNaN(parsedThreshold) || parsedThreshold <= 0) {
      nextErrors.threshold = 'Enter a valid threshold';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleCreate() {
    if (!validate()) {
      return;
    }

    const isSuccess = await create({ symbol, threshold, direction });

    if (isSuccess) {
      setSymbol('');
      setThreshold('');
      setDirection('above');
      setFieldErrors({});
    }
  }

  // ---- Loading state: show skeleton placeholders ----
  if (isLoading && items.length === 0) {
    return (
      <View
        style={[styles.centered, { backgroundColor: tokens.colors.background }]}
        testID="alerts-loading-state"
      >
        <Text
          style={[
            styles.title,
            {
              color: tokens.colors.text,
              fontSize: tokens.typography.h2.fontSize,
              fontWeight: tokens.typography.h2.fontWeight,
            },
          ]}
        >
          Alerts
        </Text>
        <Skeleton.Card width={320} height={200} testID="alerts-skeleton-form" />
        <View style={{ height: 16 }} />
        <Skeleton.Line width={280} height={14} />
        <View style={{ height: 8 }} />
        <Skeleton.Line width={240} height={14} />
      </View>
    );
  }

  // ---- Error state (no items to show) ----
  if (error && items.length === 0) {
    return (
      <View
        style={[styles.centered, { backgroundColor: tokens.colors.background }]}
        testID="alerts-error-state"
      >
        <Text
          style={[
            styles.title,
            {
              color: tokens.colors.text,
              fontSize: tokens.typography.h2.fontSize,
              fontWeight: tokens.typography.h2.fontWeight,
            },
          ]}
        >
          Alerts
        </Text>
        <Text
          style={[
            styles.errorText,
            {
              color: tokens.colors.error,
              fontSize: tokens.typography.body.fontSize,
            },
          ]}
        >
          {error}
        </Text>
        <Button
          title="Retry"
          onPress={() => void load()}
          variant="primary"
          testID="alerts-retry-button"
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { backgroundColor: tokens.colors.background },
        items.length === 0 && styles.centeredContent,
      ]}
      testID="alerts-scroll"
    >
      <Text
        style={[
          styles.title,
          {
            color: tokens.colors.text,
            fontSize: tokens.typography.h2.fontSize,
            fontWeight: tokens.typography.h2.fontWeight,
          },
        ]}
      >
        Alerts
      </Text>

      {/* Create alert form */}
      <Card testID="alerts-create-form">
        <Text
          style={[
            styles.sectionTitle,
            {
              color: tokens.colors.text,
              fontSize: tokens.typography.h4.fontSize,
              fontWeight: tokens.typography.h4.fontWeight,
            },
          ]}
        >
          Create alert
        </Text>

        <Input
          label="Symbol"
          placeholder="Symbol"
          value={symbol}
          onChangeText={(value) => {
            setSymbol(value);
            if (fieldErrors.symbol) {
              setFieldErrors((current) => ({ ...current, symbol: undefined }));
            }
          }}
          error={fieldErrors.symbol}
          disabled={isSubmitting}
          autoCapitalize="characters"
          testID="alerts-symbol-input"
        />

        {/* Stock suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestions} testID="alerts-symbol-suggestions">
            {suggestions.map((stock) => (
              <TouchableOpacity
                key={stock.symbol}
                disabled={isSubmitting}
                onPress={() => {
                  setSymbol(stock.symbol);
                  if (fieldErrors.symbol) {
                    setFieldErrors((current) => ({
                      ...current,
                      symbol: undefined,
                    }));
                  }
                }}
                testID={`alerts-suggestion-${stock.symbol}`}
              >
                <Badge text={stock.symbol} variant="info" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 12 }} />

        <Input
          label="Threshold"
          placeholder="Threshold"
          value={threshold}
          onChangeText={(value) => {
            setThreshold(value);
            if (fieldErrors.threshold) {
              setFieldErrors((current) => ({
                ...current,
                threshold: undefined,
              }));
            }
          }}
          error={fieldErrors.threshold}
          disabled={isSubmitting}
          keyboardType="numeric"
          testID="alerts-threshold-input"
        />

        {/* Direction toggle */}
        <Text
          style={[
            styles.directionLabel,
            {
              color: tokens.colors.text,
              fontSize: tokens.typography.caption.fontSize,
              fontWeight: '600',
            },
          ]}
        >
          Direction
        </Text>
        <View style={styles.directionRow}>
          {(['above', 'below'] as const).map((value) => {
            const isActive = direction === value;

            return (
              <View key={value} style={{ flex: 1 }}>
                <Button
                  title={formatDirection(value)}
                  variant={isActive ? 'primary' : 'secondary'}
                  onPress={() => setDirection(value)}
                  disabled={isSubmitting}
                  testID={`alerts-direction-${value}`}
                />
              </View>
            );
          })}
        </View>

        {submitError && (
          <Text
            style={[
              styles.inlineError,
              {
                color: tokens.colors.error,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
            testID="alerts-submit-error"
          >
            {submitError}
          </Text>
        )}

        <View style={styles.submitWrapper}>
          <Button
            title="Create alert"
            onPress={() => void handleCreate()}
            loading={isSubmitting}
            disabled={isSubmitting}
            testID="alerts-submit-button"
          />
        </View>
      </Card>

      {/* Alert list or empty state */}
      {items.length === 0 ? (
        <EmptyState
          title="No alerts yet"
          message="Create your first alert above."
          testID="alerts-empty-state"
        />
      ) : (
        <View style={styles.list} testID="alerts-list-state">
          {items.map((item) => {
            const isDeleting = deletingIds.includes(item.id);
            const deleteError = deleteErrors[item.id];

            return (
              <Card key={item.id} testID={`alerts-row-${item.id}`}>
                <View style={styles.rowHeader}>
                  <View style={styles.rowCopy}>
                    <Text
                      style={[
                        styles.symbol,
                        {
                          color: tokens.colors.text,
                          fontSize: tokens.typography.body.fontSize,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {item.symbol}
                    </Text>
                    <Text
                      style={[
                        styles.threshold,
                        {
                          color: tokens.colors.textSecondary,
                          fontSize: tokens.typography.caption.fontSize,
                        },
                      ]}
                    >
                      {formatDirection(item.direction)} {formatThreshold(item.threshold)}
                    </Text>
                  </View>
                  <View style={styles.deleteWrapper}>
                    <Button
                      title={isDeleting ? 'Deleting...' : 'Delete'}
                      variant="outline"
                      onPress={() => void remove(item.id)}
                      disabled={isDeleting}
                      testID={`alerts-delete-button-${item.id}`}
                    />
                  </View>
                </View>

                {deleteError && (
                  <Text
                    style={[
                      styles.deleteError,
                      {
                        color: tokens.colors.error,
                        fontSize: tokens.typography.caption.fontSize,
                      },
                    ]}
                    testID={`alerts-delete-error-${item.id}`}
                  >
                    {deleteError}
                  </Text>
                )}
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    padding: 20,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  directionLabel: {
    marginTop: 12,
    marginBottom: 8,
  },
  directionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inlineError: {
    marginBottom: 12,
  },
  submitWrapper: {
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCopy: {
    flex: 1,
    marginRight: 12,
  },
  symbol: {},
  threshold: {
    marginTop: 4,
  },
  deleteWrapper: {
    minWidth: 80,
  },
  deleteError: {
    marginTop: 12,
  },
});
