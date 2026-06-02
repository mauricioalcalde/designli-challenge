import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StockListing } from '@designli-challenge/shared';
import { Input } from '../Input';
import { useTheme } from '../../theme/useTheme';

interface StockSelectorProps {
  stocks: StockListing[];
  selectedStock: StockListing | null;
  onSelect: (stock: StockListing) => void;
  error?: string;
}

export function StockSelector({ stocks, selectedStock, onSelect, error }: StockSelectorProps) {
  const { tokens } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return stocks;
    return stocks.filter(
      (item) =>
        item.symbol.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized),
    );
  }, [query, stocks]);

  return (
    <>
      <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>Stock</Text>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setOpen(true)}
        style={[
          styles.selector,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: error ? tokens.colors.error : tokens.colors.border.subtle,
          },
        ]}
        testID="create-alert-stock-selector"
      >
        <Ionicons name="search-outline" size={18} color={tokens.colors.text.muted} />
        <View style={styles.selectorCopy}>
          {selectedStock ? (
            <>
              <Text style={[styles.symbol, { color: tokens.colors.text.primary }]}>
                {selectedStock.symbol}
              </Text>
              <Text style={[styles.company, { color: tokens.colors.text.secondary }]}>
                {selectedStock.name}
              </Text>
            </>
          ) : (
            <Text style={[styles.placeholder, { color: tokens.colors.text.muted }]}>
              Select a stock
            </Text>
          )}
        </View>
        {selectedStock ? (
          <Text style={[styles.price, { color: tokens.colors.text.primary }]}>
            ${selectedStock.currentPrice.toFixed(2)}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={tokens.colors.text.muted} />
      </TouchableOpacity>
      {error ? <Text style={[styles.error, { color: tokens.colors.error }]}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: tokens.colors.background,
                borderColor: tokens.colors.border.subtle,
              },
            ]}
          >
            <Text style={[styles.sheetTitle, { color: tokens.colors.text.primary }]}>
              Select stock
            </Text>
            <Input
              label="Search"
              value={query}
              placeholder="Search stocks..."
              onChangeText={setQuery}
              autoCapitalize="none"
              testID="create-alert-stock-search"
            />
            <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
              {filtered.map((item) => (
                <TouchableOpacity
                  key={item.symbol}
                  activeOpacity={0.75}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={[
                    styles.option,
                    {
                      backgroundColor: tokens.colors.surface,
                      borderColor: tokens.colors.border.subtle,
                    },
                  ]}
                  testID={`create-alert-stock-option-${item.symbol}`}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionSymbol, { color: tokens.colors.text.primary }]}>
                      {item.symbol}
                    </Text>
                    <Text style={[styles.optionCompany, { color: tokens.colors.text.secondary }]}>
                      {item.name}
                    </Text>
                  </View>
                  <Text style={[styles.optionPrice, { color: tokens.colors.text.primary }]}>
                    ${item.currentPrice.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  selector: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorCopy: {
    flex: 1,
    gap: 4,
  },
  symbol: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  company: {
    fontSize: 14,
    lineHeight: 20,
  },
  placeholder: {
    fontSize: 16,
    lineHeight: 24,
  },
  price: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
    maxHeight: '80%',
  },
  sheetTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  sheetList: {
    maxHeight: 360,
  },
  option: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionSymbol: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  optionCompany: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionPrice: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
});
