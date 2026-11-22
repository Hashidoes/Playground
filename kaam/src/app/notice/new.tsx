import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ChoiceRow, IconButton, Text } from '../../components/primitives';
import { useToast } from '../../components/Toast';
import { newTask, notices as copy } from '../../copy/strings';
import { useStore } from '../../data/store';
import { addDays, today } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, space, type } from '../../theme/tokens';

type Until = 'tomorrow' | '3days' | 'week' | 'never';
const UNTIL: { value: Until; label: string }[] = [
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: '3days', label: '3 days' },
  { value: 'week', label: 'A week' },
  { value: 'never', label: 'I remove it' },
];

export default function NoticeSheet() {
  const store = useStore();
  const toast = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [until, setUntil] = useState<Until>('3days');
  const [error, setError] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  function post() {
    const text = message.trim();
    if (!text) return setError(true);
    const days = { tomorrow: 1, '3days': 3, week: 7, never: null }[until];
    store.addNotice(text, days === null ? null : addDays(today(), days));
    toast({ message: copy.posted });
    close();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingTop: Platform.OS === 'ios' ? space[5] : insets.top + space[4], paddingBottom: space[3] }}>
        <Text variant="heading" accessibilityRole="header">{copy.sheetTitle}</Text>
        <IconButton icon="x" label={newTask.close} variant="raised" onPress={close} />
      </View>
      <View style={{ padding: space[4], gap: space[6], width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <View style={{ gap: space[2] }}>
          <TextInput
            value={message}
            onChangeText={(v) => { setMessage(v); setError(false); }}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.inkMuted}
            autoFocus
            multiline
            maxLength={140}
            accessibilityLabel={copy.sheetTitle}
            style={[type.bodyLarge, { color: colors.ink, backgroundColor: colors.surfaceRaised, borderRadius: radius.md, minHeight: 96, padding: space[5], textAlignVertical: 'top', borderWidth: error ? 2 : 0, borderColor: colors.danger }]}
          />
          {error ? <Text variant="label" color="danger">{copy.missingMessage}</Text> : null}
        </View>
        <View style={{ gap: space[2] }}>
          <Text variant="caption" color="inkMuted">{copy.showUntil}</Text>
          <ChoiceRow label={copy.showUntil} value={until} onChange={setUntil} options={UNTIL} />
        </View>
        <Button label={copy.post} onPress={post} />
      </View>
    </View>
  );
}
