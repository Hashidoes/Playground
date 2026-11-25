import { View } from 'react-native';
import { Avatar, Card, Icon, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { scores as copy } from '../../copy/strings';
import { useStore, weeklyScores } from '../../data/store';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

/** This week's score board. It starts fresh every Monday, and private tasks never count. */
export default function Scores() {
  const store = useStore();
  const { colors } = useTheme();
  const rows = weeklyScores(store.tasks, store.members);
  const total = rows.reduce((n, r) => n + r.score, 0);
  const top = rows[0]?.score ?? 0;
  const leaders = rows.filter((r) => r.score === top && top > 0);

  let headline: string;
  if (total === 0) headline = copy.nothingYet;
  else if (leaders.length > 1) headline = copy.tie;
  else if (leaders[0].member.id === store.meId) headline = copy.youLead;
  else headline = copy.someoneLeads(leaders[0].member.name);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodySemibold" color="inkMuted">{`${copy.title} · ${copy.thisWeek}`}</Text>
          <Text variant="title" color="highlight" accessibilityRole="header">{headline}</Text>
        </View>
        <Icon name="trophy" size={56} color={colors.accent} />
      </View>

      <Card style={{ paddingVertical: space[5], paddingHorizontal: space[6], gap: space[4] }}>
        {rows.map((r) => {
          const lead = r.score === top && top > 0;
          return (
            <View key={r.member.id} accessible accessibilityLabel={copy.rowLabel(r.member.name, r.score)} style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
              <Avatar name={r.member.name} color={r.member.color} size={32} />
              <Text variant="bodyStrong" color={lead ? 'ink' : 'inkMuted'} style={{ flex: 1 }}>
                {r.member.id === store.meId ? `${r.member.name} (you)` : r.member.name}
              </Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'], color: lead ? colors.highlight : colors.inkMuted }}>
                {r.score}
              </Text>
            </View>
          );
        })}
      </Card>

      {total > 0 ? <Text variant="bodyLarge">{copy.total(total)}</Text> : null}
      <Text variant="label" color="inkMuted">{copy.footnote}</Text>
    </Screen>
  );
}
