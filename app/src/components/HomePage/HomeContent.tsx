import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';
import { useHomePageContext } from '@/context/HomePageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { buildShareMessage } from '@/services/home-content-service';

export function HomeContent() {
  const {
    compact,
    contentId,
    quote,
    authorName,
    hasPrevious,
    isNavigating,
    isPreviousPending,
    isNextPending,
    goPrevious,
    goNext,
  } = useHomePageContext();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const reduceMotion = useReducedMotion();
  const [liked, setLiked] = useState(false);
  const previousDisabled = !hasPrevious || isNavigating;
  const nextIconColor =
    colorScheme === 'dark' ? theme.background : theme.backgroundElement;

  useEffect(() => {
    setLiked(false);
  }, [contentId]);

  async function shareQuote() {
    await Share.share({ message: buildShareMessage(quote, authorName) });
  }

  return (
    <View style={[styles.quoteArea, compact && styles.quoteAreaCompact]}>
      <ScrollView
        key={contentId ?? 'fallback'}
        contentContainerStyle={styles.quoteScrollContent}
        showsVerticalScrollIndicator
        style={styles.quoteScroll}
      >
        <Animated.Text
          accessibilityRole="text"
          entering={reduceMotion ? undefined : FadeIn.duration(180)}
          style={[
            styles.quote,
            compact && styles.quoteCompact,
            { color: theme.text },
          ]}
        >
          {quote ? quote : 'Loading...'}
        </Animated.Text>
        {authorName ? (
          <Animated.Text
            entering={reduceMotion ? undefined : FadeIn.delay(80).duration(180)}
            style={[styles.author, { color: theme.textSecondary }]}
          >
            — {authorName}
          </Animated.Text>
        ) : null}
      </ScrollView>

      <View style={styles.controls}>
        <View style={styles.navigationRow}>
          <View style={styles.navigationItem}>
            <Pressable
              accessibilityLabel="Xem câu trước"
              accessibilityRole="button"
              accessibilityState={{ disabled: previousDisabled }}
              disabled={previousDisabled}
              hitSlop={8}
              onPress={goPrevious}
              style={({ pressed }) => [
                styles.navigationButton,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.outline,
                },
                pressed && styles.pressed,
                previousDisabled && styles.previousDisabled,
              ]}
            >
              {isPreviousPending ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons name="chevron-back" size={25} color={theme.primary} />
              )}
            </Pressable>
            <Text
              style={[
                styles.navigationLabel,
                { color: theme.textSecondary },
                !hasPrevious && styles.disabledLabel,
              ]}
            >
              Câu trước
            </Text>
          </View>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.navigationRule, { backgroundColor: theme.divider }]}
          />

          <View style={styles.navigationItem}>
            <Pressable
              accessibilityLabel="Xem câu tiếp theo"
              accessibilityRole="button"
              accessibilityState={{ disabled: isNavigating }}
              disabled={isNavigating}
              hitSlop={8}
              onPress={goNext}
              style={({ pressed }) => [
                styles.navigationButton,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
                isNavigating && styles.nextDisabled,
              ]}
            >
              {isNextPending ? (
                <ActivityIndicator size="small" color={nextIconColor} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={25}
                  color={nextIconColor}
                />
              )}
            </Pressable>
            <Text style={[styles.navigationLabel, { color: theme.primary }]}>
              Câu tiếp
            </Text>
          </View>
        </View>

        <View style={styles.secondaryActions}>
          <Pressable
            accessibilityLabel={
              liked ? 'Bỏ yêu thích câu nói' : 'Yêu thích câu nói'
            }
            accessibilityRole="button"
            accessibilityState={{ selected: liked }}
            onPress={() => setLiked((value) => !value)}
            style={({ pressed }) => [
              styles.secondaryAction,
              {
                borderColor: theme.outline,
                backgroundColor: liked ? theme.primarySoft : 'transparent',
              },
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: liked ? 'heart.fill' : 'heart',
                android: liked ? 'favorite' : 'favorite_border',
                web: 'favorite',
              }}
              size={22}
              tintColor={theme.primaryAction}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Chia sẻ câu nói"
            accessibilityRole="button"
            onPress={() => void shareQuote()}
            style={({ pressed }) => [
              styles.secondaryAction,
              { borderColor: theme.outline },
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: 'square.and.arrow.up',
                android: 'share',
                web: 'share',
              }}
              size={21}
              tintColor={theme.primaryAction}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quoteArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 2,
  },
  quoteAreaCompact: { gap: 24 },
  quoteScroll: {
    width: '100%',
    marginTop: 20,
    maxWidth: 560,
    flex: 1,
    maxHeight: 300,
  },
  quoteScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  quote: {
    width: '100%',
    textAlign: 'center',
    fontFamily: BrandFonts.bold,
    fontSize: 18,
    lineHeight: 41,
    letterSpacing: -0.5,
  },
  quoteCompact: { fontSize: 25, lineHeight: 35 },
  author: {
    marginTop: 18,
    textAlign: 'center',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  controls: {
    alignItems: 'center',
    gap: 36,
  },
  navigationRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 22,
  },
  navigationItem: { width: 76, alignItems: 'center', gap: 8 },
  navigationButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationRule: { width: 28, height: 1, marginTop: 27 },
  navigationLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  secondaryActions: { flexDirection: 'row', gap: 18 },
  secondaryAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.62, transform: [{ scale: 0.97 }] },
  previousDisabled: { opacity: 0.38 },
  nextDisabled: { opacity: 0.65 },
  disabledLabel: { opacity: 0.48 },
});
