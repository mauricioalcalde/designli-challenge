import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AlertDirection } from '@designli-challenge/shared';
import { useAlertsStore, useStocksStore } from '../../data/container';

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

  const suggestions = useMemo(() => {
    const normalizedSymbol = symbol.trim().toUpperCase();

    return stocks
      .filter((stock) => {
        if (!normalizedSymbol) {
          return true;
        }

        return stock.symbol.includes(normalizedSymbol) || stock.name.toUpperCase().includes(normalizedSymbol);
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

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centered} testID="alerts-loading-state">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.helperText}>Loading alerts...</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centered} testID="alerts-error-state">
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => void load()}
          testID="alerts-retry-button"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        items.length === 0 && styles.centeredContent,
      ]}
      testID="alerts-scroll"
    >
      <Text style={styles.title}>Alerts</Text>

      <View style={styles.formCard} testID="alerts-create-form">
        <Text style={styles.sectionTitle}>Create alert</Text>

        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isSubmitting}
          onChangeText={(value) => {
            setSymbol(value);
            if (fieldErrors.symbol) {
              setFieldErrors((current) => ({ ...current, symbol: undefined }));
            }
          }}
          placeholder="Symbol"
          style={[styles.input, fieldErrors.symbol && styles.inputError]}
          testID="alerts-symbol-input"
          value={symbol}
        />
        {fieldErrors.symbol ? <Text style={styles.fieldError}>{fieldErrors.symbol}</Text> : null}

        {suggestions.length > 0 ? (
          <View style={styles.suggestions} testID="alerts-symbol-suggestions">
            {suggestions.map((stock) => (
              <TouchableOpacity
                key={stock.symbol}
                disabled={isSubmitting}
                onPress={() => {
                  setSymbol(stock.symbol);
                  if (fieldErrors.symbol) {
                    setFieldErrors((current) => ({ ...current, symbol: undefined }));
                  }
                }}
                style={styles.suggestionChip}
                testID={`alerts-suggestion-${stock.symbol}`}
              >
                <Text style={styles.suggestionText}>{stock.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <TextInput
          editable={!isSubmitting}
          keyboardType="numeric"
          onChangeText={(value) => {
            setThreshold(value);
            if (fieldErrors.threshold) {
              setFieldErrors((current) => ({ ...current, threshold: undefined }));
            }
          }}
          placeholder="Threshold"
          style={[styles.input, fieldErrors.threshold && styles.inputError]}
          testID="alerts-threshold-input"
          value={threshold}
        />
        {fieldErrors.threshold ? (
          <Text style={styles.fieldError}>{fieldErrors.threshold}</Text>
        ) : null}

        <View style={styles.directionRow}>
          {(['above', 'below'] as const).map((value) => {
            const isActive = direction === value;

            return (
              <TouchableOpacity
                key={value}
                disabled={isSubmitting}
                onPress={() => setDirection(value)}
                style={[styles.directionButton, isActive && styles.directionButtonActive]}
                testID={`alerts-direction-${value}`}
              >
                <Text
                  style={[styles.directionButtonText, isActive && styles.directionButtonTextActive]}
                >
                  {formatDirection(value)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {submitError ? (
          <Text style={styles.inlineError} testID="alerts-submit-error">
            {submitError}
          </Text>
        ) : null}

        <TouchableOpacity
          disabled={isSubmitting}
          onPress={() => void handleCreate()}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          testID="alerts-submit-button"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Create alert</Text>
          )}
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState} testID="alerts-empty-state">
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.helperText}>Create your first alert above.</Text>
        </View>
      ) : (
        <View style={styles.list} testID="alerts-list-state">
          {items.map((item) => {
            const isDeleting = deletingIds.includes(item.id);
            const deleteError = deleteErrors[item.id];

            return (
              <View key={item.id} style={styles.card} testID={`alerts-row-${item.id}`}>
                <View style={styles.rowHeader}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.symbol}>{item.symbol}</Text>
                    <Text style={styles.threshold}>
                      {formatDirection(item.direction)} {formatThreshold(item.threshold)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={isDeleting}
                    onPress={() => void remove(item.id)}
                    style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                    testID={`alerts-delete-button-${item.id}`}
                  >
                    <Text style={styles.deleteButtonText}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {deleteError ? (
                  <Text style={styles.deleteError} testID={`alerts-delete-error-${item.id}`}>
                    {deleteError}
                  </Text>
                ) : null}
              </View>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
  },
  helperText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
  },
  formCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#C62828',
  },
  fieldError: {
    color: '#C62828',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 4,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E4ECF7',
  },
  suggestionText: {
    color: '#164B87',
    fontWeight: '600',
  },
  directionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  directionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B8C4D4',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  directionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F2FF',
  },
  directionButtonText: {
    color: '#4A5568',
    fontWeight: '600',
  },
  directionButtonTextActive: {
    color: '#007AFF',
  },
  inlineError: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
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
  symbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
  threshold: {
    marginTop: 4,
    fontSize: 14,
    color: '#666666',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#D32F2F',
  },
  deleteButtonDisabled: {
    backgroundColor: '#D7D7D7',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteError: {
    marginTop: 12,
    fontSize: 14,
    color: '#C62828',
  },
});
