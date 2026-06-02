import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStocksStore } from '../../data/container';
import { useConnectivity } from '../hooks/useConnectivity';
import { useAppState } from '../hooks/useAppState';
import { EmptyState, ScreenContainer, Skeleton, StockItemCard } from '../components';
import {
  MarketSearchBar,
  MarketStatusPill,
  MarketSummaryCard,
  MarketTopBar,
  WatchlistHeader,
} from '../components/stocks';
import { useTheme } from '../theme/useTheme';

export type StocksStackParamList = {
  StocksList: undefined;
  StockChart: { symbol: string };
  Inbox: undefined;
};

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatChange(value: number): string {
  const icon = value >= 0 ? '▲' : '▼';
  return `${icon} ${Math.abs(value).toFixed(2)}%`;
}

export function StocksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<StocksStackParamList>>();
  const [query, setQuery] = useState('');
  const items = useStocksStore((state) => state.items);
  const isInitialLoading = useStocksStore((state) => state.isInitialLoading);
  const isBackgroundRefreshing = useStocksStore((state) => state.isBackgroundRefreshing);
  const isManualRefreshing = useStocksStore((state) => state.isManualRefreshing);
  const isStale = useStocksStore((state) => state.isStale);
  const lastUpdatedAt = useStocksStore((state) => state.lastUpdatedAt);
  const error = useStocksStore((state) => state.error);
  const staleReason = useStocksStore((state) => state.staleReason);
  const loadInitial = useStocksStore((state) => state.loadInitial);
  const refreshInBackground = useStocksStore((state) => state.refreshInBackground);
  const refreshManually = useStocksStore((state) => state.refreshManually);
  const { tokens } = useTheme();
  const isOnline = useConnectivity();
  const appState = useAppState();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadInitial();

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }, [loadInitial]),
  );

  // Controlled polling: active only when focused, app in foreground, and online
  useFocusEffect(
    useCallback(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      const isFocused = true;
      const canPoll =
        isFocused &&
        isOnline &&
        appState === 'active' &&
        items.length > 0 &&
        !isInitialLoading &&
        !isBackgroundRefreshing &&
        !isManualRefreshing;

      if (canPoll) {
        pollingRef.current = setInterval(() => {
          void refreshInBackground();
        }, 10000);
      }

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }, [
      appState,
      isBackgroundRefreshing,
      isInitialLoading,
      isManualRefreshing,
      isOnline,
      items.length,
      refreshInBackground,
    ]),
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

  const showInitialLoader = isInitialLoading && items.length === 0;
  const hardErrorState = !isInitialLoading && error && items.length === 0;
  const emptySearchState =
    !showInitialLoader && !hardErrorState && items.length > 0 && filteredItems.length === 0;
  const showBackgroundIndicator = isBackgroundRefreshing && items.length > 0;

  return (
    <ScreenContainer testID="stocks-screen">
      {showInitialLoader ? (
        <View style={styles.centered} testID="stocks-loading-state">
          <MarketTopBar onRefresh={() => void refreshManually()} />
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
          <MarketTopBar onRefresh={() => void loadInitial()} />
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
            action={{ label: 'Retry', onPress: () => void loadInitial() }}
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
              refreshing={isManualRefreshing}
              onRefresh={() => void refreshManually()}
              tintColor={tokens.colors.primary}
            />
          }
        >
          <MarketTopBar onRefresh={() => void refreshManually()} />

          <View style={styles.headerBlock}>
            <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>
              Market Overview
            </Text>
            <Text style={[styles.headerSubtitle, { color: tokens.colors.text.secondary }]}>
              Track leaders, movers, and your next opportunity.
            </Text>
            {items.length > 0 ? (
              <MarketStatusPill
                isBackgroundRefreshing={showBackgroundIndicator}
                isStale={isStale}
                isOffline={!isOnline}
                lastUpdatedAt={lastUpdatedAt}
                staleReason={staleReason ?? undefined}
              />
            ) : null}
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
  list: {
    gap: 12,
  },
});
