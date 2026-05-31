import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import type { ChartRange, StockChartPoint } from '@designli-challenge/shared';
import { useRoute } from '@react-navigation/native';
import { useStocksStore } from '../../data/container';

const TIMEFRAMES: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y'];

function formatAxisDate(epoch: number): string {
  const d = new Date(epoch);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface ChartContentProps {
  data: StockChartPoint[];
  range: ChartRange;
}

const ChartContent = ({ data, range }: ChartContentProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData: any[] = useMemo(
    () =>
      data.map((point) => ({
        epoch: new Date(point.timestamp).getTime(),
        close: point.close,
      })),
    [data],
  );

  return (
    <View style={{ height: 300 }} testID="stock-chart-area">
      <CartesianChart
        key={range}
        data={chartData}
        xKey="epoch"
        yKeys={['close']}
        axisOptions={{
          tickCount: { x: 5, y: 5 },
          formatXLabel: (label: unknown) => formatAxisDate(label as number),
          formatYLabel: (label: unknown) => `$${(label as number).toFixed(0)}`,
        }}
      >
        {({ points }) => (
          <Line
            points={points.close}
            color="#007AFF"
            strokeWidth={2}
            animate={{ type: 'timing', duration: 300 }}
          />
        )}
      </CartesianChart>
    </View>
  );
};

export function StockChartScreen() {
  const route = useRoute<{ key: string; name: string; params: { symbol: string } }>();
  const symbol = route.params.symbol;

  const chartData = useStocksStore((state) => state.chartData);
  const chartRange = useStocksStore((state) => state.chartRange);
  const chartIsLoading = useStocksStore((state) => state.chartIsLoading);
  const chartError = useStocksStore((state) => state.chartError);
  const loadChart = useStocksStore((state) => state.loadChart);

  useEffect(() => {
    void loadChart(symbol, '1W');
  }, [symbol, loadChart]);

  const handleTimeframePress = (range: ChartRange) => {
    void loadChart(symbol, range);
  };

  const handleRetry = () => {
    void loadChart(symbol, chartRange);
  };

  const isLoading = chartIsLoading && chartData.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.container} testID="stock-chart-screen">
      {/* Header */}
      <View style={styles.header} testID="stock-chart-symbol-header">
        <Text style={styles.symbol}>{symbol}</Text>
      </View>

      {/* Timeframe selector */}
      <View style={styles.timeframeRow}>
        {TIMEFRAMES.map((tf) => {
          const isActive = tf === chartRange;
          return (
            <TouchableOpacity
              key={tf}
              testID={`chart-timeframe-${tf}`}
              style={[styles.timeframePill, isActive && styles.timeframePillActive]}
              onPress={() => handleTimeframePress(tf)}
              disabled={chartIsLoading}
            >
              <Text style={[styles.timeframeText, isActive && styles.timeframeTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content area */}
      {isLoading ? (
        <View style={styles.centered} testID="stock-chart-loading">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.helperText}>Loading chart...</Text>
        </View>
      ) : chartError && chartData.length === 0 ? (
        <View style={styles.centered} testID="stock-chart-error">
          <Text style={styles.errorText}>{chartError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            testID="stock-chart-retry-button"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : chartData.length === 0 ? (
        <View style={styles.centered} testID="stock-chart-empty">
          <Text style={styles.emptyText}>No chart data available</Text>
        </View>
      ) : (
        <ChartContent data={chartData} range={chartRange} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  symbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeframePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeframePillActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  timeframeTextActive: {
    color: '#FFFFFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
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
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});
