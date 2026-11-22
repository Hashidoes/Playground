import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, ChoiceRow, IconButton, Text } from '../../components/primitives';
import { useToast } from '../../components/Toast';
import { newTask as copy, reminderLabels, repeatLabels, tasks as taskCopy } from '../../copy/strings';
import { useStore } from '../../data/store';
import type { Reminder, Repeat, Time } from '../../data/types';
import { addDays, formatShortDate, formatTime, timeFromDate, today } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, space, type } from '../../theme/tokens';

const TIMES: Time[] = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '18:30', '20:00', '21:30'];
const REPEATS: Repeat[] = ['none', 'daily', 'alternate', 'weekly', 'fortnightly', 'monthly'];
const REMINDERS: Reminder[] = ['off', 'at_time', '15_min', '1_hour'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="caption" color="inkMuted">{label}</Text>
      {children}
    </View>
  );
}

export default function TaskSheet() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const store = useStore();
  const toast = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const existing = id ? store.tasks.find((t) => t.id === id) : undefined;
  const now = today();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [assigneeId, setAssigneeId] = useState<string | null>(existing ? existing.assigneeId : store.meId);
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? (date && date >= now ? date : now));
  const [dueTime, setDueTime] = useState<Time | null>(existing?.dueTime ?? null);
  const [repeat, setRepeat] = useState<Repeat>(existing?.repeat ?? 'none');
  const [reminder, setReminder] = useState<Reminder>(existing?.reminder ?? 'off');
  const [note, setNote] = useState(existing?.note ?? '');
  const [pickingDate, setPickingDate] = useState(dueDate !== now && dueDate !== addDays(now, 1));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dates = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(now, i)), [now]);
  const suggestions = store.suggestions.filter((s) => s.toLowerCase().includes(title.trim().toLowerCase()) && s !== title).slice(0, 5);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  function save() {
    const name = title.trim();
    if (!name) return setError(copy.missingName);
    if (dueDate === now && dueTime && dueTime < timeFromDate(new Date()) && !existing) return setError(copy.timePassed);
    const fields = { title: name, assigneeId, dueDate, dueTime, repeat, reminder: dueTime ? reminder : 'off', note: note.trim() || undefined };
    if (existing) {
      store.updateTask({ ...existing, ...fields });
    } else {
      store.addTask(fields);
      const who = store.memberById(assigneeId);
      toast({ message: who ? copy.addedFor(who.id === store.meId ? 'you' : who.name) : copy.addedForAnyone });
    }
    close();
  }

  function remove() {
    if (!existing) return;
    const removed = store.deleteTask(existing.id, existing.repeat !== 'none');
    toast({ message: taskCopy.deletedToast, action: { label: taskCopy.undo, onPress: () => store.restoreTasks(removed) } });
    close();
  }

  const people = [store.me, ...store.members.filter((m) => m.id !== store.meId)];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingTop: Platform.OS === 'ios' ? space[5] : insets.top + space[4], paddingBottom: space[3] }}>
        <Text variant="heading" accessibilityRole="header">{existing ? copy.editTitle : copy.title}</Text>
        <IconButton icon="x" label={copy.close} variant="raised" onPress={close} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space[4], paddingBottom: insets.bottom + space[10], gap: space[6], width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <View style={{ gap: space[3] }}>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); setError(null); }}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.inkMuted}
            autoFocus={!existing}
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabel={copy.placeholder}
            style={[type.bodyLarge, { color: colors.ink, backgroundColor: colors.surfaceRaised, borderRadius: radius.md, height: 62, paddingHorizontal: space[6], borderWidth: error ? 2 : 0, borderColor: colors.danger }]}
          />
          {error ? <Text variant="label" color="danger" accessibilityLiveRegion="assertive">{error}</Text> : null}
          {!existing && suggestions.length ? (
            <View style={{ gap: space[2] }}>
              <Text variant="label" color="inkMuted">{copy.suggestions}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
                {suggestions.map((s) => <Chip key={s} label={s} icon="plus" onPress={() => { setTitle(s); setError(null); }} />)}
              </View>
            </View>
          ) : null}
        </View>

        <Field label={copy.who}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
            {people.map((m) => (
              <Chip key={m.id} label={m.id === store.meId ? copy.me : m.name} selected={assigneeId === m.id} onPress={() => setAssigneeId(m.id)} />
            ))}
            <Chip label={copy.anyone} selected={assigneeId === null} onPress={() => setAssigneeId(null)} />
          </View>
        </Field>

        <Field label={copy.when}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
            <Chip label={copy.today} selected={!pickingDate && dueDate === now} onPress={() => { setDueDate(now); setPickingDate(false); }} />
            <Chip label={copy.tomorrow} selected={!pickingDate && dueDate === addDays(now, 1)} onPress={() => { setDueDate(addDays(now, 1)); setPickingDate(false); }} />
            <Chip label={pickingDate ? formatShortDate(dueDate) : copy.pickDate} selected={pickingDate} onPress={() => setPickingDate(true)} />
          </View>
          {pickingDate ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
              {dates.slice(2).map((d) => (
                <Chip key={d} label={formatShortDate(d)} selected={dueDate === d} onPress={() => setDueDate(d)} />
              ))}
            </ScrollView>
          ) : null}
        </Field>

        <Field label={copy.time}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
            <Chip label={copy.anyTime} selected={dueTime === null} onPress={() => setDueTime(null)} />
            {TIMES.map((t) => <Chip key={t} label={formatTime(t)} selected={dueTime === t} onPress={() => setDueTime(t)} />)}
          </ScrollView>
        </Field>

        <Field label={copy.repeat}>
          <ChoiceRow label={copy.repeat} value={repeat} onChange={setRepeat} options={REPEATS.map((r) => ({ value: r, label: repeatLabels[r] }))} />
        </Field>

        {dueTime ? (
          <Field label={copy.remind}>
            <ChoiceRow label={copy.remind} value={reminder} onChange={setReminder} options={REMINDERS.map((r) => ({ value: r, label: reminderLabels[r] }))} />
          </Field>
        ) : null}

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={copy.notePlaceholder}
          placeholderTextColor={colors.inkMuted}
          multiline
          accessibilityLabel={copy.notePlaceholder}
          style={[type.body, { color: colors.ink, backgroundColor: colors.surfaceRaised, borderRadius: radius.md, minHeight: 88, padding: space[4], textAlignVertical: 'top' }]}
        />

        <Button label={existing ? copy.save : copy.add} onPress={save} />

        {existing ? (
          confirmDelete ? (
            <View style={{ gap: space[3], padding: space[4], borderRadius: radius.md, borderWidth: 2, borderColor: colors.danger }}>
              <Text variant="bodyStrong">{copy.deleteTitle(existing.title)}</Text>
              {existing.repeat !== 'none' ? <Text variant="body" color="inkMuted">{copy.deleteRepeating}</Text> : null}
              <View style={{ flexDirection: 'row', gap: space[3] }}>
                <Button label={copy.deleteConfirm} variant="danger" onPress={remove} style={{ flex: 1 }} />
                <Button label={copy.keep} variant="ghost" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <Button label={copy.delete} variant="ghost" icon="trash" onPress={() => setConfirmDelete(true)} />
          )
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
