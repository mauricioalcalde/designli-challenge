import { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStocksStore } from '../../data/container';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { useTheme } from '../theme/useTheme';

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

  const { tokens } = useTheme();

  useEffect(() => {
    void load();
  }, [load]);

  // ---- Loading: skeleton cards ----
  if (isLoading && items.length === 0) {
    return (
      <View
        style={[styles.centered, { backgroundColor: tokens.colors.background }]}
        testID="stocks-loading-state"
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
          Stocks
        </Text>
        <Skeleton.Card width={320} height={72} testID="stocks-skeleton-card-1" />
        <View style={{ height: 12 }} />
        <Skeleton.Card width={320} height={72} testID="stocks-skeleton-card-2" />
        <View style={{ height: 12 }} />
        <Skeleton.Card width={320} height={72} testID="stocks-skeleton-card-3" />
      </View>
    );
  }

  // ---- Error with no items ----
  if (error && items.length === 0) {
    return (
      <View
        style={[styles.centered, { backgroundColor: tokens.colors.background }]}
        testID="stocks-error-state"
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
          Stocks
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
          testID="stocks-retry-button"
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
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />}
      testID="stocks-scroll"
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
        Stocks
      </Text>

      {/* Stale banner */}
      {isStale && lastUpdatedAt && (
        <View
          style={[
            styles.staleBanner,
            {
              backgroundColor: `${tokens.colors.warning}20`,
              borderColor: tokens.colors.warning,
            },
          ]}
          testID="stocks-stale-banner"
        >
          <Text
            style={{
              fontSize: tokens.typography.caption.fontSize,
              fontWeight: '600',
              color: tokens.colors.warning,
            }}
          >
            Showing your last saved stocks snapshot.
          </Text>
          <Text
            style={[
              styles.staleTimestamp,
              {
                color: tokens.colors.warning,
                fontSize: tokens.typography.caption.fontSize,
              },
            ]}
          >
            Last updated {formatSnapshotTimestamp(lastUpdatedAt)}
          </Text>
        </View>
      )}

      {error && !isStale && (
        <Text
          style={[
            styles.inlineError,
            {
              color: tokens.colors.error,
              fontSize: tokens.typography.caption.fontSize,
            },
          ]}
        >
          {error}
        </Text>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <View style={styles.emptyState} testID="stocks-empty-state">
          <Text
            style={[
              styles.emptyTitle,
              {
                color: tokens.colors.text,
                fontSize: tokens.typography.h3.fontSize,
                fontWeight: '600',
              },
            ]}
          >
            No stocks available
          </Text>
          <Text
            style={[
              styles.helperText,
              {
                color: tokens.colors.textSecondary,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
          >
            Pull to refresh and try again.
          </Text>
        </View>
      ) : (
        /* Stock cards with trend badges */
        <View style={styles.list} testID="stocks-list-state">
          {items.map((item) => {
            const isPositive = item.changePercent >= 0;
            const trendArrow = isPositive ? '▲' : '▼';
            const badgeVariant = isPositive ? 'success' : 'error';
            const changeText = `${trendArrow} ${formatChangePercent(item.changePercent)}`;

            return (
              <Card
                key={item.symbol}
                onPress={() => navigation.navigate('StockChart', { symbol: item.symbol })}
                testID={`stocks-row-${item.symbol}`}
              >
                <View style={styles.row}>
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
                        styles.name,
                        {
                          color: tokens.colors.textSecondary,
                          fontSize: tokens.typography.caption.fontSize,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.rowValues}>
                    <Text
                      style={[
                        styles.price,
                        {
                          color: tokens.colors.text,
                          fontSize: tokens.typography.body.fontSize,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {formatPrice(item.currentPrice)}
                    </Text>
                    <Badge text={changeText} variant={badgeVariant} />
                  </View>
                </View>
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
  inlineError: {
    marginBottom: 12,
  },
  staleBanner: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  staleTimestamp: {
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {},
  helperText: {
    marginTop: 8,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCopy: {
    flex: 1,
    marginRight: 12,
  },
  rowValues: {
    alignItems: 'flex-end',
  },
  symbol: {},
  name: {
    marginTop: 4,
  },
  price: {},
});
