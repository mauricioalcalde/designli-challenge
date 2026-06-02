import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInboxStore } from '../../application/inbox.store';
import { formatRelativeTime } from '../utils/time-format';
import { EmptyState, ScreenContainer } from '../components';
import { useTheme } from '../theme/useTheme';
import type { InboxNotification } from '../../data/notifications.local';

function itemIcon(type?: string): keyof typeof Ionicons.glyphMap {
  if (type === 'alert') return 'trending-up';
  return 'notifications-outline';
}

export function InboxScreen() {
  const { tokens } = useTheme();
  const notifications = useInboxStore((s) => s.notifications);
  const unreadCount = useInboxStore((s) => s.unreadCount);
  const isLoading = useInboxStore((s) => s.isLoading);
  const error = useInboxStore((s) => s.error);
  const loadInbox = useInboxStore((s) => s.loadInbox);
  const markAsRead = useInboxStore((s) => s.markAsRead);
  const markAllRead = useInboxStore((s) => s.markAllRead);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handlePressItem = useCallback(
    (id: string) => {
      markAsRead(id);
    },
    [markAsRead],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllRead();
  }, [markAllRead]);

  const handleRefresh = useCallback(() => {
    loadInbox();
  }, [loadInbox]);

  const renderItem = useCallback(
    ({ item }: { item: InboxNotification }) => (
      <TouchableOpacity
        style={[
          styles.item,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border.subtle,
          },
        ]}
        onPress={() => handlePressItem(item.id)}
        testID={`inbox-item-${item.id}`}
        activeOpacity={0.7}
      >
        {/* Left icon */}
        <View style={[styles.iconContainer, { backgroundColor: tokens.colors.bg.default }]}>
          <Ionicons name={itemIcon(item.type)} size={20} color={tokens.colors.text.secondary} />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text
              style={[
                styles.itemTitle,
                {
                  color: tokens.colors.text.primary,
                  fontFamily: tokens.typography.title.fontFamily,
                  fontSize: tokens.typography.title.fontSize,
                  fontWeight: item.read ? '400' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.read && (
              <View
                testID={`inbox-item-dot-${item.id}`}
                style={[styles.unreadDot, { backgroundColor: tokens.colors.info }]}
              />
            )}
          </View>
          <Text
            style={[
              styles.itemBody,
              {
                color: tokens.colors.text.secondary,
                fontSize: tokens.typography.bodySmall.fontSize,
                fontFamily: tokens.typography.bodySmall.fontFamily,
              },
            ]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
          <Text
            style={[
              styles.itemTimestamp,
              {
                color: tokens.colors.text.muted,
                fontSize: tokens.typography.caption.fontSize,
                fontFamily: tokens.typography.caption.fontFamily,
              },
            ]}
          >
            {formatRelativeTime(item.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [tokens, handlePressItem],
  );

  const keyExtractor = useCallback((item: InboxNotification) => item.id, []);

  // Loading state — only when no data exists
  if (isLoading && notifications.length === 0) {
    return (
      <ScreenContainer testID="inbox-screen">
        <View style={styles.centeredState} testID="inbox-loading-state">
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text
            style={[
              styles.stateText,
              {
                color: tokens.colors.text.secondary,
                fontSize: tokens.typography.body.fontSize,
              },
            ]}
          >
            Loading notifications...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error state — only when no data exists
  if (error && notifications.length === 0) {
    return (
      <ScreenContainer testID="inbox-screen">
        <View style={styles.centeredState} testID="inbox-error-state">
          <EmptyState
            title="Failed to load notifications"
            message="Please try again."
            action={{ label: 'Retry', onPress: () => loadInbox() }}
            testID="inbox-error-content"
          />
        </View>
      </ScreenContainer>
    );
  }

  // Empty state
  if (notifications.length === 0 && !isLoading) {
    return (
      <ScreenContainer testID="inbox-screen">
        <EmptyState
          title="No notifications yet"
          message="Triggered stock alerts will appear here."
          testID="inbox-empty-state"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="inbox-screen">
      {/* Mark all as read bar */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[
            styles.markAllBar,
            {
              backgroundColor: tokens.colors.surface,
              borderBottomColor: tokens.colors.border.subtle,
            },
          ]}
          onPress={handleMarkAllRead}
          testID="inbox-mark-all-read"
        >
          <Ionicons name="checkmark-done-outline" size={20} color={tokens.colors.info} />
          <Text
            style={[
              styles.markAllText,
              {
                color: tokens.colors.info,
                fontSize: tokens.typography.label.fontSize,
                fontFamily: tokens.typography.label.fontFamily,
                fontWeight: '600',
              },
            ]}
          >
            Mark all as read
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        testID="inbox-flatlist"
        data={notifications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && notifications.length > 0}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  stateText: {
    textAlign: 'center',
  },
  markAllBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  markAllText: {
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  itemTitle: {
    flex: 1,
  },
  itemTimestamp: {
    marginTop: 6,
  },
  itemBody: {
    lineHeight: 20,
    marginBottom: 2,
  },
});
