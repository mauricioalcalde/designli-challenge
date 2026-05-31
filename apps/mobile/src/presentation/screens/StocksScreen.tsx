import { useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStocksStore } from '../../data/container';

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatChangePercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

function formatSnapshotTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export type StocksStackParamList = {
  StocksList: undefined;
  StockChart: { symbol: string };
};

export function StocksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<StocksStackParamList>>();
  const items = useStocksStore((state) => state.items);
  const isLoading = useStocksStore((state) => state.isLoading);
  const isRefreshing = useStocksStore((state) => state.isRefreshing);
  const isStale = useStocksStore((state) => state.isStale);
  const lastUpdatedAt = useStocksStore((state) => state.lastUpdatedAt);
  const error = useStocksStore((state) => state.error);
  const load = useStocksStore((state) => state.load);
  const refresh = useStocksStore((state) => state.refresh);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centered} testID="stocks-loading-state">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.helperText}>Loading stocks...</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centered} testID="stocks-error-state">
        <Text style={styles.title}>Stocks</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => void load()}
          testID="stocks-retry-button"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, items.length === 0 && styles.centeredContent]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />}
      testID="stocks-scroll"
    >
      <Text style={styles.title}>Stocks</Text>

      {isStale && lastUpdatedAt ? (
        <View style={styles.staleBanner} testID="stocks-stale-banner">
          <Text style={styles.staleTitle}>Showing your last saved stocks snapshot.</Text>
          <Text style={styles.staleTimestamp}>
            Last updated {formatSnapshotTimestamp(lastUpdatedAt)}
          </Text>
        </View>
      ) : null}

      {error && !isStale ? <Text style={styles.inlineError}>{error}</Text> : null}

      {items.length === 0 ? (
        <View style={styles.emptyState} testID="stocks-empty-state">
          <Text style={styles.emptyTitle}>No stocks available</Text>
          <Text style={styles.helperText}>Pull to refresh and try again.</Text>
        </View>
      ) : (
        <View style={styles.list} testID="stocks-list-state">
          {items.map((item) => (
            <TouchableOpacity
              key={item.symbol}
              style={styles.row}
              testID={`stocks-row-${item.symbol}`}
              onPress={() => navigation.navigate('StockChart', { symbol: item.symbol })}
              activeOpacity={0.7}
            >
              <View style={styles.rowCopy}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.name}>{item.name}</Text>
              </View>
              <View style={styles.rowValues}>
                <Text style={styles.price}>{formatPrice(item.currentPrice)}</Text>
                <Text
                  style={[
                    styles.change,
                    item.changePercent >= 0 ? styles.positive : styles.negative,
                  ]}
                >
                  {formatChangePercent(item.changePercent)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  inlineError: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 12,
  },
  staleBanner: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F4C542',
  },
  staleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A5C00',
  },
  staleTimestamp: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A5C00',
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
  },
  rowCopy: {
    flex: 1,
    marginRight: 12,
  },
  rowValues: {
    alignItems: 'flex-end',
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
  name: {
    marginTop: 4,
    fontSize: 14,
    color: '#666666',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  change: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  positive: {
    color: '#0F9D58',
  },
  negative: {
    color: '#C62828',
  },
});
