import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAlertsStore, useStocksStore } from '../../data/container';
import { AlertItemCard, Button, EmptyState, ScreenContainer, Skeleton } from '../components';
import { AlertsSummaryCard, AlertsTopBar, Toast } from '../components/alerts';
import type { AlertsStackParamList } from '../navigation/AlertsStack';
import { useTheme } from '../theme/useTheme';
import type { AlertsFeedback, LocalAlertDraft } from './alerts.shared';
import { getRemoteAlertStatus } from './alerts.shared';

export function AlertsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AlertsStackParamList>>();
  const route = useRoute<{
    key: string;
    name: string;
    params?: AlertsStackParamList['AlertsList'];
  }>();
  const { tokens } = useTheme();
  const items = useAlertsStore((state) => state.items);
  const stocks = useStocksStore((state) => state.items);
  const isLoading = useAlertsStore((state) => state.isLoading);
  const deletingIds = useAlertsStore((state) => state.deletingIds);
  const error = useAlertsStore((state) => state.error);
  const deleteErrors = useAlertsStore((state) => state.deleteErrors);
  const load = useAlertsStore((state) => state.load);
  const remove = useAlertsStore((state) => state.remove);
  const [drafts, setDrafts] = useState<LocalAlertDraft[]>([]);
  const [currentToast, setCurrentToast] = useState<AlertsFeedback | null>(null);
  const handledParamsRef = useRef<string | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const nextParams = route.params;

    if (!nextParams) {
      return;
    }

    const paramsKey = JSON.stringify(nextParams);

    if (handledParamsRef.current === paramsKey) {
      return;
    }

    handledParamsRef.current = paramsKey;

    if (nextParams.createdDraft) {
      const draft: LocalAlertDraft = {
        ...nextParams.createdDraft,
        createdAt: new Date().toISOString(),
      };
      setDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)]);
    }

    if (nextParams.feedback) {
      const newFeedback = nextParams.feedback as AlertsFeedback;
      setCurrentToast(newFeedback);
    }
  }, [route.params]);

  const serverAlerts = useMemo(
    () =>
      items.map((item) => ({
        kind: 'remote' as const,
        id: item.id,
        symbol: item.symbol,
        threshold: item.threshold,
        direction: item.direction,
        status: getRemoteAlertStatus(item),
        createdAt: item.createdAt,
        isDeleting: deletingIds.includes(item.id),
        errorMessage: deleteErrors[item.id],
      })),
    [deleteErrors, deletingIds, items],
  );

  const localAlerts = useMemo(
    () =>
      drafts.map((item) => ({
        kind: 'local' as const,
        id: item.id,
        symbol: item.symbol,
        threshold: item.threshold,
        direction: item.direction,
        status: item.status,
        createdAt: item.createdAt,
      })),
    [drafts],
  );

  const combinedAlerts = [...localAlerts, ...serverAlerts];
  const stockMap = useMemo(
    () => new Map(stocks.map((item) => [item.symbol.toUpperCase(), item])),
    [stocks],
  );
  const statusCounts = combinedAlerts.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { active: 0, triggered: 0, pending: 0, failed: 0 },
  );

  const loadingState = isLoading && combinedAlerts.length === 0;
  const errorState = error && combinedAlerts.length === 0;

  const navigateToCreate = () => {
    navigation.navigate('CreateAlert', undefined);
  };

  return (
    <ScreenContainer testID="alerts-list-screen">
      {loadingState ? (
        <View style={styles.centered} testID="alerts-list-loading-state">
          <AlertsTopBar onRefresh={() => void load()} />
          <View style={styles.headerBlock}>
            <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>Alerts</Text>
            <Text style={[styles.headerSubtitle, { color: tokens.colors.text.secondary }]}>
              Monitor your price targets and triggered movements.
            </Text>
          </View>
          <View style={styles.loadingStack}>
            <Skeleton.Card width={320} height={110} testID="alerts-list-skeleton-1" />
            <Skeleton.Card width={320} height={110} testID="alerts-list-skeleton-2" />
          </View>
        </View>
      ) : errorState ? (
        <View style={styles.centered} testID="alerts-list-error-state">
          <AlertsTopBar onRefresh={() => void load()} />
          <View style={styles.headerBlock}>
            <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>Alerts</Text>
            <Text style={[styles.headerSubtitle, { color: tokens.colors.text.secondary }]}>
              Monitor your price targets and triggered movements.
            </Text>
          </View>
          <EmptyState
            title="Failed to load alerts"
            message="Please try again."
            action={{ label: 'Retry', onPress: () => void load() }}
            testID="alerts-list-error-content"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          testID="alerts-list-scroll"
          refreshControl={
            <RefreshControl
              refreshing={isLoading && combinedAlerts.length > 0}
              onRefresh={() => void load()}
              testID="alerts-list-refresh-control"
            />
          }
        >
          <AlertsTopBar onRefresh={() => void load()} />

          <View style={styles.headerBlock}>
            <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>Alerts</Text>
            <Text style={[styles.headerSubtitle, { color: tokens.colors.text.secondary }]}>
              Monitor your price targets and triggered movements.
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <AlertsSummaryCard
              label="Active alerts"
              value={String(statusCounts.active + statusCounts.pending)}
              subtitle="Watching now"
              accent={tokens.colors.success}
              testID="alerts-summary-active"
            />
            <AlertsSummaryCard
              label="Triggered"
              value={String(statusCounts.triggered)}
              subtitle="This week"
              accent={tokens.colors.primary}
              testID="alerts-summary-triggered"
            />
          </View>

          <Button
            title="Create Alert"
            onPress={navigateToCreate}
            testID="alerts-list-create-button"
          />

          {combinedAlerts.length === 0 ? (
            <View style={styles.emptyStateWrap}>
              <EmptyState
                title="No alerts yet. Create your first alert."
                message="Start with one price level and we’ll keep watch for you."
                testID="alerts-list-empty-state"
              />
              <Button
                title="Create Alert"
                onPress={navigateToCreate}
                testID="alerts-list-empty-create-button"
              />
            </View>
          ) : (
            <View style={styles.list} testID="alerts-list-state">
              <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
                Alerts
              </Text>
              {combinedAlerts.map((item) => (
                <AlertItemCard
                  key={`${item.kind}-${item.id}`}
                  symbol={item.symbol}
                  companyName={stockMap.get(item.symbol.toUpperCase())?.name}
                  currentPrice={stockMap.get(item.symbol.toUpperCase())?.currentPrice}
                  targetPrice={item.threshold}
                  direction={item.direction}
                  status={item.status}
                  timestamp={item.createdAt}
                  isDeleting={item.kind === 'remote' ? item.isDeleting : false}
                  errorMessage={item.kind === 'remote' ? item.errorMessage : undefined}
                  onDelete={() => {
                    if (item.kind === 'remote') {
                      void remove(item.id);
                      return;
                    }

                    setDrafts((current) => current.filter((draft) => draft.id !== item.id));
                  }}
                  testID={`alert-item-${item.id}`}
                  deleteTestID={`alert-item-delete-${item.id}`}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {currentToast ? (
        <Toast
          message={currentToast.message}
          type={currentToast.tone}
          onDismiss={() => setCurrentToast(null)}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'center',
    gap: 24,
  },
  loadingStack: {
    gap: 12,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
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
    fontSize: 16,
    lineHeight: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  feedbackBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  emptyStateWrap: {
    gap: 16,
  },
});
