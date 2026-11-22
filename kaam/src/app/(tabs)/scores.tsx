import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Card, Icon, PillTabs, Text } from '../../components/primitives';
import { Screen } from '../../components/Screen';
import { scores as copy } from '../../copy/strings';
import { scoresFor, useStore, type Period } from '../../data/store';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

type Tab = (typeof copy.tabs)[number];
const PERIOD: Record<Tab, Period> = { 'This week': 'week', 'This month': 'month', 'All time': 'all' };
const PERIOD_WORDS: Record<Period, string> = { week: 'this week', month: 'this month', all: 'so far' };

export default function Scores() {
  const store = useStore();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('This week');
  const period = PERIOD[tab];
  const rows = scoresFor(store.tasks, store.members, period);
  const total = rows.reduce((n, r) => n + r.score, 0);
  const top = rows[0]?.score ?? 0;
  const leaders = rows.filter((r) => r.score === top && top > 0);

  let headline: string;
  if (total === 0) headline = period === 'month' ? copy.nothingYetMonth : copy.nothingYet;
  else if (leaders.length > 1) headline = copy.tie;
  else if (leaders[0].member.id === store.meId) headline = period === 'week' ? copy.youLead : period === 'month' ? copy.youLeadMonth : copy.youLeadAll;
  else headline = copy.someoneLeads(leaders[0].member.name, PERIOD_WORDS[period]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodySemibold" color="inkMuted">{copy.title}</Text>
          <Text variant="title" color="highlight" accessibilityRole="header">{headline}</Text>
        </View>
        <Icon name="trophy" size={56} color={colors.accent} />
      </View>

      <PillTabs items={copy.tabs} value={tab} onChange={setTab} label="Period" />

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

      {total > 0 ? <Text variant="bodyLarge">{copy.total(total, PERIOD_WORDS[period])}</Text> : null}
      {period === 'week' ? <Text variant="label" color="inkMuted">{copy.footnote}</Text> : null}
    </Screen>
  );
}
