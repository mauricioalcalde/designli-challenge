import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStocksStore } from '../../data/container';
import { EmptyState, ScreenContainer, Skeleton, StockItemCard } from '../components';
import {
  MarketSearchBar,
  MarketSummaryCard,
  MarketTopBar,
  WatchlistHeader,
} from '../components/stocks';
import { useTheme } from '../theme/useTheme';

export type StocksStackParamList = {
  StocksList: undefined;
  StockChart: { symbol: string };
};

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatChange(value: number): string {
  const icon = value >= 0 ? '▲' : '▼';
  return `${icon} ${Math.abs(value).toFixed(2)}%`;
}

function formatSnapshotTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export function StocksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<StocksStackParamList>>();
  const [query, setQuery] = useState('');
  const items = useStocksStore((state) => state.items);
  const isLoading = useStocksStore((state) => state.isLoading);
  const isRefreshing = useStocksStore((state) => state.isRefreshing);
  const isStale = useStocksStore((state) => state.isStale);
  const lastUpdatedAt = useStocksStore((state) => state.lastUpdatedAt);
  const error = useStocksStore((state) => state.error);
  const staleMessage = useStocksStore((state) => state.staleMessage);
  const load = useStocksStore((state) => state.load);
  const refresh = useStocksStore((state) => state.refresh);
  const { tokens } = useTheme();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const sync = async () => {
        if (!active) return;
        const state = useStocksStore.getState();
        if (state.items.length === 0) {
          await load();
          return;
        }

        await refresh();
      };

      void sync();

      // Poll every 10s for near real-time updates (single source of truth: quotes)
      const interval = setInterval(() => {
        void sync();
      }, 10000);

      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [load, refresh]),
  );

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized),
    );
  }, [items, query]);

  const portfolioTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.currentPrice, 0),
    [items],
  );
  const topGainer = useMemo(() => {
    if (items.length === 0) return null;
    return items.reduce((best, item) => (item.changePercent > best.changePercent ? item : best));
  }, [items]);

  const loadingState = isLoading && items.length === 0;
  const hardErrorState = error && items.length === 0;
  const emptySearchState =
    !loadingState && !hardErrorState && items.length > 0 && filteredItems.length === 0;

  return (
    <ScreenContainer testID="stocks-screen">
      {loadingState ? (
        <View style={styles.centered} testID="stocks-loading-state">
          <MarketTopBar onRefresh={() => void refresh()} />
          <View style={styles.headerBlock}>
            <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>
              Market Overview
            </Text>
            <Text style={[styles.headerSubtitle, { color: tokens.colors.text.secondary }]}>
              Track leaders, movers, and your next opportunity.
            </Text>
          </View>
          <Text style={[styles.loadingCopy, { color: tokens.colors.text.secondary }]}>
            Fetching latest prices...
          </Text>
          <View style={styles.loadingStack}>
            <View style={styles.summaryRow}>
              <Skeleton.Card width={'100%'} height={92} testID="stocks-skeleton-summary-1" />
              <Skeleton.Card width={'100%'} height={92} testID="stocks-skeleton-summary-2" />
            </View>
            <Skeleton.Line width={'100%'} height={48} testID="stocks-skeleton-search" />
            <Skeleton.Card width={'100%'} height={72} testID="stocks-skeleton-card-1" />
            <Skeleton.Card width={'100%'} height={72} testID="stocks-skeleton-card-2" />
            <Skeleton.Card width={'100%'} height={72} testID="stocks-skeleton-card-3" />
          </View>
        </View>
      ) : hardErrorState ? (
        <View style={styles.centered} testID="stocks-error-state">
          <MarketTopBar onRefresh={() => void load()} />
          <View style={styles.headerBlock}>
            <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>
              Market Overview
            </Text>
            <Text style={[styles.headerSubtitle, { color: tokens.colors.text.secondary }]}>
              Track leaders, movers, and your next opportunity.
            </Text>
          </View>
          <EmptyState
            title="Failed to load market data"
            message="Please try again."
            action={{ label: 'Retry', onPress: () => void load() }}
            testID="stocks-error-content"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          testID="stocks-scroll"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refresh()}
              tintColor={tokens.colors.primary}
            />
          }
        >
          <MarketTopBar onRefresh={() => void refresh()} />

          <View style={styles.headerBlock}>
            <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>
              Market Overview
            </Text>
            <Text style={[styles.headerSubtitle, { color: tokens.colors.text.secondary }]}>
              Track leaders, movers, and your next opportunity.
            </Text>
          </View>

          {items.length > 0 ? (
            <View style={styles.summaryRow}>
              <MarketSummaryCard
                label="Total portfolio"
                value={formatCurrency(portfolioTotal)}
                footer="Demo summary"
                accent={tokens.colors.text.secondary}
                testID="stocks-stat-total"
              />
              <MarketSummaryCard
                label="Top gainer"
                value={topGainer?.symbol ?? '—'}
                footer={topGainer ? formatChange(topGainer.changePercent) : undefined}
                accent={
                  topGainer && topGainer.changePercent >= 0
                    ? tokens.colors.success
                    : tokens.colors.error
                }
                testID="stocks-stat-top-gainer"
              />
            </View>
          ) : null}

          <MarketSearchBar
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            testID="stocks-search-bar"
          />

          {isStale && lastUpdatedAt ? (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: tokens.colors.bg.surface,
                  borderColor: tokens.colors.border.subtle,
                },
              ]}
              testID="stocks-stale-banner"
            >
              <Text style={[styles.bannerTitle, { color: tokens.colors.warning }]}>
                {staleMessage ?? "You're offline. Showing cached data."}
              </Text>
              <Text style={[styles.bannerMeta, { color: tokens.colors.text.muted }]}>
                Last sync {formatSnapshotTimestamp(lastUpdatedAt)}
              </Text>
            </View>
          ) : null}

          <WatchlistHeader title="Watchlist" />

          {items.length === 0 ? (
            <EmptyState
              title="No stocks found"
              message="Try adjusting your search."
              testID="stocks-empty-state"
            />
          ) : emptySearchState ? (
            <EmptyState
              title="No stocks found"
              message="Try adjusting your search."
              testID="stocks-search-empty-state"
            />
          ) : (
            <View style={styles.list} testID="stocks-list-state">
              {filteredItems.map((item) => (
                <StockItemCard
                  key={item.symbol}
                  symbol={item.symbol}
                  name={item.name}
                  price={item.currentPrice}
                  changePercent={item.changePercent}
                  onPress={() => navigation.navigate('StockChart', { symbol: item.symbol })}
                  testID={`stock-item-card-${item.symbol}`}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 24,
  },
  centered: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'center',
    gap: 24,
  },
  headerBlock: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingStack: {
    gap: 16,
  },
  loadingCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  bannerTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  bannerMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  list: {
    gap: 12,
  },
});
