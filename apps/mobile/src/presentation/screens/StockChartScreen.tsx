import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import type { ChartRange, StockChartPoint } from '@designli-challenge/shared';
import { useRoute } from '@react-navigation/native';
import { useStocksStore } from '../../data/container';
import { Button } from '../components/Button';
import { useTheme } from '../theme/useTheme';

const TIMEFRAMES: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y'];

function formatAxisLabel(epoch: number): string {
  const d = new Date(epoch);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatPriceLabel(value: number): string {
  return `$${value.toFixed(0)}`;
}

export function StockChartScreen() {
  const route = useRoute<{
    key: string;
    name: string;
    params: { symbol: string };
  }>();
  const symbol = route.params.symbol;

  const chartData = useStocksStore((state) => state.chartData);
  const chartRange = useStocksStore((state) => state.chartRange);
  const chartIsLoading = useStocksStore((state) => state.chartIsLoading);
  const chartError = useStocksStore((state) => state.chartError);
  const loadChart = useStocksStore((state) => state.loadChart);

  const { tokens } = useTheme();

  useEffect(() => {
    void loadChart(symbol, '1W');
  }, [symbol, loadChart]);

  const handleTimeframePress = (range: ChartRange) => {
    void loadChart(symbol, range);
  };

  const handleRetry = () => {
    void loadChart(symbol, chartRange);
  };

  const handleRefresh = () => {
    void loadChart(symbol, chartRange);
  };

  const isLoading = chartIsLoading && chartData.length === 0;

  const lineData = useMemo(
    () =>
      chartData.map((point: StockChartPoint) => ({
        value: point.close,
        label: formatAxisLabel(new Date(point.timestamp).getTime()),
      })),
    [chartData],
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: tokens.colors.background,
          padding: tokens.spacing.md,
        },
      ]}
      testID="stock-chart-screen"
      refreshControl={
        <RefreshControl
          refreshing={chartIsLoading}
          onRefresh={handleRefresh}
          testID="chart-refresh-control"
        />
      }
    >
      <View style={styles.header} testID="stock-chart-symbol-header">
        <Text
          style={[
            styles.symbol,
            {
              color: tokens.colors.text,
              fontSize: tokens.typography.h3.fontSize,
              fontWeight: tokens.typography.h3.fontWeight,
            },
          ]}
        >
          {symbol}
        </Text>
      </View>

      <View style={styles.timeframeRow}>
        {TIMEFRAMES.map((tf) => {
          const isActive = tf === chartRange;
          return (
            <TouchableOpacity
              key={tf}
              testID={`chart-timeframe-${tf}`}
              style={[
                styles.timeframePill,
                {
                  backgroundColor: isActive ? tokens.colors.primary : tokens.colors.surface,
                  borderColor: isActive ? tokens.colors.primary : tokens.colors.border,
                },
              ]}
              onPress={() => handleTimeframePress(tf)}
              disabled={chartIsLoading}
            >
              <Text
                style={[
                  styles.timeframeText,
                  {
                    color: isActive ? '#FFFFFF' : tokens.colors.textSecondary,
                    fontSize: tokens.typography.caption.fontSize,
                    fontWeight: '600',
                  },
                ]}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.centered} testID="stock-chart-loading">
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={[styles.helperText, { color: tokens.colors.textSecondary }]}>
            Loading chart...
          </Text>
        </View>
      ) : chartError && chartData.length === 0 ? (
        <View style={styles.centered} testID="stock-chart-error">
          <Text style={[styles.errorText, { color: tokens.colors.error }]}>{chartError}</Text>
          <Button
            title="Retry"
            onPress={handleRetry}
            variant="primary"
            testID="stock-chart-retry-button"
          />
        </View>
      ) : chartData.length === 0 ? (
        <View style={styles.centered} testID="stock-chart-empty">
          <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>
            No chart data available
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer} testID="stock-chart-area">
          <LineChart
            data={lineData}
            color={tokens.colors.chartLine}
            thickness={2}
            startFillColor={tokens.colors.chartFill}
            endFillColor="transparent"
            startOpacity={0.3}
            endOpacity={0}
            spacing={40}
            backgroundColor={tokens.colors.background}
            yAxisColor={tokens.colors.border}
            xAxisColor={tokens.colors.border}
            yAxisTextStyle={{ color: tokens.colors.textSecondary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: tokens.colors.textSecondary, fontSize: 10 }}
            formatYLabel={formatPriceLabel}
            hideDataPoints
            curved
            height={250}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  header: { marginBottom: 12 },
  symbol: {},
  timeframeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  timeframePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeframeText: {},
  chartContainer: { marginTop: 8 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
  },
  helperText: { marginTop: 12, textAlign: 'center' },
  errorText: { textAlign: 'center', marginBottom: 16 },
  emptyText: { textAlign: 'center' },
});
