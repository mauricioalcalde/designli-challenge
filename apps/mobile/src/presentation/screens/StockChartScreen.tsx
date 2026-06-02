import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import type { ChartRange, StockChartPoint } from '@designli-challenge/shared';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useStocksStore } from '../../data/container';
import { Button, ChartCard, EmptyState, ScreenContainer, Skeleton } from '../components';
import {
  CurrentPriceCard,
  RangeStatsRow,
  StockIdentityHeader,
  TimeRangeSelector,
} from '../components/stocks';
import { useTheme } from '../theme/useTheme';

const TIMEFRAMES: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y'];

function formatAxisLabel(epoch: number): string {
  const date = new Date(epoch);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatPriceLabel(label: string): string {
  const value = Number(label);
  return Number.isNaN(value) ? label : `$${value.toFixed(0)}`;
}

function isNetworkLikeChartError(message: string | null): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  if (
    normalized.includes("don't have access") ||
    normalized.includes('403') ||
    normalized.includes('forbidden')
  ) {
    return false;
  }
  return (
    normalized.includes('network') ||
    normalized.includes('timeout') ||
    normalized.includes('failed to fetch chart') ||
    normalized.includes('unable to load chart') ||
    normalized.includes('no response')
  );
}

function isAccessDeniedChartError(message: string | null): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("don't have access") ||
    normalized.includes('403') ||
    normalized.includes('forbidden')
  );
}

export function calculateYAxisRange(chartData: StockChartPoint[]): { min: number; max: number } {
  if (chartData.length === 0) {
    return { min: 0, max: 0 };
  }

  const lows = chartData.map((p) => p.low);
  const highs = chartData.map((p) => p.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min;

  if (range === 0) {
    // Single flat line — add 1% padding for visibility
    const padding = max * 0.01 || 1;
    return { min: min - padding, max: max + padding };
  }

  const padding = range * 0.05;
  return { min: min - padding, max: max + padding };
}

export function StockChartScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: { symbol: string } }>();
  const symbol = route.params.symbol;
  const items = useStocksStore((state) => state.items);
  const chartData = useStocksStore((state) => state.chartData);
  const chartRange = useStocksStore((state) => state.chartRange);
  const chartIsLoading = useStocksStore((state) => state.chartIsLoading);
  const chartError = useStocksStore((state) => state.chartError);
  const loadChart = useStocksStore((state) => state.loadChart);
  const refreshStocks = useStocksStore((state) => state.refresh);
  const { tokens } = useTheme();
  const [chartWidth, setChartWidth] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const sync = async () => {
        await refreshStocks();
        if (active) {
          await loadChart(symbol, useStocksStore.getState().chartRange);
        }
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
    }, [refreshStocks, loadChart, symbol]),
  );

  const stock = items.find((item) => item.symbol === symbol);
  const currentPrice = stock?.currentPrice ?? chartData[chartData.length - 1]?.close ?? 0;
  const companyName = stock?.name ?? `${symbol} price history`;
  const hasCachedQuote = Boolean(stock);
  const isLoadingState = chartIsLoading && chartData.length === 0;
  const shouldShowOfflineBanner = Boolean(
    chartError && hasCachedQuote && isNetworkLikeChartError(chartError),
  );
  const shouldShowProviderBanner = Boolean(
    chartError &&
    !shouldShowOfflineBanner &&
    (isAccessDeniedChartError(chartError) || chartError.toLowerCase().includes('server error')),
  );
  const hasCachedChartData = chartData.length > 0;

  const rangeStats = useMemo(() => {
    if (chartData.length === 0) return null;
    const open = chartData[0].open;
    const highs = chartData.map((point) => point.high);
    const lows = chartData.map((point) => point.low);
    return {
      open,
      high: Math.max(...highs),
      low: Math.min(...lows),
    };
  }, [chartData]);

  const periodChange = useMemo(() => {
    if (chartData.length === 0) {
      return {
        value: stock?.changePercent ? (currentPrice * stock.changePercent) / 100 : 0,
        percent: stock?.changePercent ?? 0,
      };
    }

    const start = chartData[0].open;
    const end = chartData[chartData.length - 1].close;
    const value = end - start;
    const percent = start === 0 ? 0 : (value / start) * 100;
    return { value, percent };
  }, [chartData, currentPrice, stock?.changePercent]);

  const periodLabel = useMemo(() => {
    switch (chartRange) {
      case '1D':
        return 'today';
      case '1W':
        return 'this week';
      case '1M':
        return 'this month';
      case '3M':
        return '3 months';
      case '1Y':
        return 'this year';
      default:
        return 'selected range';
    }
  }, [chartRange]);

  const changeLabel = `${periodChange.percent >= 0 ? '▲' : '▼'} ${Math.abs(periodChange.percent).toFixed(2)}% (${periodChange.value >= 0 ? '+' : '-'}${Math.abs(periodChange.value).toFixed(2)}) ${periodLabel}`;

  const lineData = useMemo(
    () =>
      chartData.map((point: StockChartPoint) => ({
        value: point.close,
        label: formatAxisLabel(new Date(point.timestamp).getTime()),
      })),
    [chartData],
  );

  const yAxisRange = useMemo(() => calculateYAxisRange(chartData), [chartData]);

  const refreshChart = useCallback(async () => {
    await refreshStocks();
    await loadChart(symbol, chartRange);
  }, [chartRange, loadChart, refreshStocks, symbol]);

  return (
    <ScreenContainer testID="stock-chart-screen">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={chartIsLoading}
            onRefresh={refreshChart}
            tintColor={tokens.colors.primary}
          />
        }
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            testID="stock-chart-back-button"
          >
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={refreshChart}
            activeOpacity={0.7}
            testID="stock-chart-top-refresh-button"
          >
            <Ionicons name="refresh-outline" size={22} color={tokens.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <StockIdentityHeader symbol={symbol} name={companyName} />

        <CurrentPriceCard
          price={currentPrice}
          changeLabel={changeLabel}
          isPositive={periodChange.percent >= 0}
        />

        <TimeRangeSelector
          value={chartRange}
          options={TIMEFRAMES}
          onChange={(range) => void loadChart(symbol, range)}
        />

        {shouldShowOfflineBanner ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: tokens.colors.bg.surface,
                borderColor: tokens.colors.border.subtle,
              },
            ]}
            testID="stock-chart-offline-banner"
          >
            <Text style={[styles.bannerTitle, { color: tokens.colors.warning }]}>
              You’re offline. Showing cached market data.
            </Text>
          </View>
        ) : null}

        {!shouldShowOfflineBanner && shouldShowProviderBanner && hasCachedChartData ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: tokens.colors.bg.surface,
                borderColor: tokens.colors.border.subtle,
              },
            ]}
            testID="stock-chart-provider-banner"
          >
            <Text style={[styles.bannerTitle, { color: tokens.colors.info }]}>
              Historical chart unavailable from provider. Showing recent live price snapshots.
            </Text>
          </View>
        ) : null}

        {isLoadingState ? (
          <View style={styles.centered} testID="stock-chart-loading">
            <Skeleton.Card height={120} testID="stock-chart-skeleton-price" />
            <Skeleton.Card height={280} testID="stock-chart-skeleton-chart" />
          </View>
        ) : chartError && chartData.length === 0 && !hasCachedQuote ? (
          <View style={styles.centered} testID="stock-chart-error">
            <EmptyState
              title="Failed to load data"
              message="Please try again."
              action={{ label: 'Retry', onPress: refreshChart }}
              testID="stock-chart-error-content"
            />
          </View>
        ) : chartError && chartData.length === 0 ? (
          <View style={styles.centered} testID="stock-chart-empty-with-quote">
            <EmptyState
              title={
                shouldShowOfflineBanner
                  ? 'No cached chart available'
                  : shouldShowProviderBanner
                    ? 'Building live chart history'
                    : 'No data available'
              }
              message={
                shouldShowOfflineBanner
                  ? 'Reconnect and try again to load this time range.'
                  : shouldShowProviderBanner
                    ? 'Keep the app open a bit longer so we can collect enough live price points.'
                    : 'Try another time range.'
              }
              testID="stock-chart-empty-content"
            />
          </View>
        ) : chartData.length === 0 ? (
          <View style={styles.centered} testID="stock-chart-empty">
            <EmptyState
              title="No data available"
              message="Try another time range."
              testID="stock-chart-empty-content"
            />
          </View>
        ) : (
          <ChartCard
            title="Performance"
            subtitle={`${symbol} · ${chartRange}`}
            testID="stock-chart-area"
          >
            <View
              style={styles.chartViewport}
              onLayout={(event) => {
                const w = event.nativeEvent.layout.width;
                if (w > 0 && w !== chartWidth) setChartWidth(w);
              }}
            >
              {chartWidth > 0 ? (
                <LineChart
                  width={chartWidth}
                  data={lineData}
                  color={tokens.colors.chart.primary}
                  thickness={3}
                  startFillColor={tokens.colors.chart.primary}
                  endFillColor="transparent"
                  startOpacity={0.28}
                  endOpacity={0.02}
                  spacing={(chartWidth / Math.max(lineData.length, 1)) * 0.7}
                  areaChart
                  curved
                  height={240}
                  hideDataPoints
                  backgroundColor={tokens.colors.bg.elevated}
                  yAxisColor={tokens.colors.chart.grid}
                  xAxisColor={tokens.colors.chart.grid}
                  rulesColor={tokens.colors.chart.grid}
                  showVerticalLines
                  verticalLinesColor={tokens.colors.chart.grid}
                  yAxisTextStyle={{ color: tokens.colors.chart.label, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: tokens.colors.chart.label, fontSize: 10 }}
                  formatYLabel={formatPriceLabel}
                  noOfSections={4}
                  yAxisMinValue={yAxisRange.min}
                  yAxisMaxValue={yAxisRange.max}
                />
              ) : null}
            </View>
            {rangeStats ? (
              <RangeStatsRow open={rangeStats.open} high={rangeStats.high} low={rangeStats.low} />
            ) : null}
          </ChartCard>
        )}

        <View style={styles.actionColumn}>
          <Button
            title="Create Alert"
            onPress={() =>
              navigation.navigate('Alerts', {
                screen: 'CreateAlert',
                params: { symbol, currentPrice },
              })
            }
            testID="stock-chart-create-alert-button"
          />
          <Button
            title="Refresh"
            variant="secondary"
            onPress={refreshChart}
            testID="stock-chart-refresh-button"
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionColumn: {
    gap: 12,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  bannerTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  centered: {
    minHeight: 280,
    justifyContent: 'center',
    gap: 16,
  },
  chartViewport: {
    width: '100%',
    overflow: 'hidden',
  },
});
