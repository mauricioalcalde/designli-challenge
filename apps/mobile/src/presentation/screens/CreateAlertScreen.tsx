import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AlertDirection } from '@designli-challenge/shared';
import { useAlertsStore, useStocksStore } from '../../data/container';
import { useConnectivity } from '../hooks/useConnectivity';
import { Button, Input, ScreenContainer, SegmentedControl } from '../components';
import { AlertPreviewCard, StockSelector } from '../components/alerts';
import type { AlertsStackParamList } from '../navigation/AlertsStack';
import { useTheme } from '../theme/useTheme';

export function CreateAlertScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AlertsStackParamList>>();
  const route = useRoute<{
    key: string;
    name: string;
    params?: AlertsStackParamList['CreateAlert'];
  }>();
  const { tokens } = useTheme();
  const isConnected = useConnectivity();
  const stocks = useStocksStore((state) => state.items);
  const create = useAlertsStore((state) => state.create);
  const isSubmitting = useAlertsStore((state) => state.isSubmitting);
  const submitError = useAlertsStore((state) => state.submitError);
  const routeSymbol = route.params?.symbol?.trim().toUpperCase() ?? '';
  const routePrice = route.params?.currentPrice;
  const [symbol, setSymbol] = useState(routeSymbol);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [errors, setErrors] = useState<{ symbol?: string; targetPrice?: string }>({});

  const normalizedSymbol = symbol.trim().toUpperCase();
  const selectedStock = useMemo(
    () =>
      stocks.find((item) => item.symbol.toUpperCase() === normalizedSymbol) ??
      (routeSymbol && normalizedSymbol === routeSymbol
        ? {
            symbol: routeSymbol,
            name: `${routeSymbol} stock`,
            currentPrice: routePrice ?? 0,
            changePercent: 0,
          }
        : null),
    [normalizedSymbol, routePrice, routeSymbol, stocks],
  );
  const currentPrice = selectedStock?.currentPrice ?? routePrice ?? null;
  const numericTargetPrice = Number(targetPrice);
  const hasValidTargetPrice =
    targetPrice.trim() && !Number.isNaN(numericTargetPrice) && numericTargetPrice > 0;
  const isFormValid = Boolean(selectedStock && hasValidTargetPrice && direction);
  const explanation = !selectedStock
    ? 'Select a stock to preview your alert.'
    : !hasValidTargetPrice
      ? 'Enter a target price to preview your alert.'
      : `You’ll be notified when ${selectedStock.symbol} goes ${direction} $${numericTargetPrice.toFixed(2)}.`;

  const validate = () => {
    const nextErrors: { symbol?: string; targetPrice?: string } = {};

    if (!normalizedSymbol) {
      nextErrors.symbol = 'Select a stock first.';
    }

    if (!hasValidTargetPrice) {
      nextErrors.targetPrice = targetPrice.trim()
        ? 'Target price must be greater than zero.'
        : 'Enter a valid target price.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const navigateBackToList = (params: AlertsStackParamList['AlertsList']) => {
    navigation.navigate('AlertsList', params);
  };

  const handleCreate = async () => {
    if (!validate()) {
      return;
    }

    if (!isConnected) {
      navigateBackToList({
        createdDraft: {
          id: `pending-${normalizedSymbol}-${Date.now()}`,
          symbol: normalizedSymbol,
          threshold: numericTargetPrice,
          direction,
          status: 'pending',
        },
        feedback: {
          tone: 'info',
          title: 'Saved locally',
          message: "Saved locally. This alert will sync when you're back online.",
        },
      });
      return;
    }

    const isSuccess = await create({ symbol: normalizedSymbol, threshold: targetPrice, direction });

    if (!isSuccess) {
      return;
    }

    navigateBackToList({
      feedback: {
        tone: 'success',
        title: 'Alert created',
        message: `We’ll watch ${normalizedSymbol} and let you know when it moves ${direction} $${numericTargetPrice.toFixed(2)}.`,
      },
    });
  };

  return (
    <ScreenContainer testID="create-alert-screen">
      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            testID="create-alert-back-button"
          >
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: tokens.colors.text.primary }]}>
            Create Alert
          </Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.headerBlock}>
          <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>
            Create price alert
          </Text>
          <Text style={[styles.headerSubtitle, { color: tokens.colors.text.secondary }]}>
            Choose a stock and set the price level that should trigger a notification.
          </Text>
        </View>

        <StockSelector
          stocks={stocks}
          selectedStock={selectedStock}
          onSelect={(stock) => {
            setSymbol(stock.symbol);
            if (errors.symbol) {
              setErrors((current) => ({ ...current, symbol: undefined }));
            }
          }}
          error={errors.symbol}
        />

        {selectedStock && typeof currentPrice === 'number' ? (
          <Text style={[styles.currentPrice, { color: tokens.colors.textSecondary }]}>
            Current price ${currentPrice.toFixed(2)}
          </Text>
        ) : null}

        {!isConnected ? (
          <View
            style={[
              styles.offlineCard,
              {
                backgroundColor: tokens.colors.bg.surface,
                borderColor: `${tokens.colors.info}55`,
              },
            ]}
          >
            <Text style={[styles.offlineTitle, { color: tokens.colors.text.primary }]}>
              Offline mode
            </Text>
            <Text style={[styles.offlineBody, { color: tokens.colors.text.secondary }]}>
              Save now, sync later. We’ll keep this alert pending until you’re back online.
            </Text>
          </View>
        ) : null}

        <Input
          label="Target price"
          value={targetPrice}
          placeholder="0.00"
          onChangeText={(value) => {
            setTargetPrice(value);
            if (errors.targetPrice) {
              setErrors((current) => ({ ...current, targetPrice: undefined }));
            }
          }}
          error={errors.targetPrice}
          keyboardType="numeric"
          disabled={isSubmitting}
          testID="create-alert-target-input"
        />

        <View style={styles.fieldStack}>
          <Text style={[styles.directionLabel, { color: tokens.colors.text.secondary }]}>
            Direction
          </Text>
          <SegmentedControl
            options={[
              { label: 'Above', value: 'above' },
              { label: 'Below', value: 'below' },
            ]}
            value={direction}
            onChange={(value) => setDirection(value as AlertDirection)}
            testID="create-alert-direction"
          />
        </View>

        <AlertPreviewCard message={explanation} complete={isFormValid} />

        {submitError ? (
          <Text style={[styles.errorText, { color: tokens.colors.error }]}>{submitError}</Text>
        ) : null}

        <Button
          title="Create Alert"
          onPress={() => void handleCreate()}
          loading={isSubmitting}
          disabled={isSubmitting || !isFormValid}
          testID="create-alert-submit-button"
        />

        <Text style={[styles.footerNote, { color: tokens.colors.text.muted }]}>
          We’ll notify you when the price condition is met.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  spacer: {
    width: 24,
    height: 24,
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
    fontSize: 16,
    lineHeight: 24,
  },
  currentPrice: {
    marginTop: -8,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldStack: {
    gap: 10,
  },
  offlineCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  offlineBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  directionLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
