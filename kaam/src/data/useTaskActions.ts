import { useCallback } from 'react';
import { tasks as copy } from '../copy/strings';
import { useToast } from '../components/Toast';
import { todaysTasks, useStore } from './store';
import type { Task } from './types';

/** Finishing and reopening tasks, with the feedback described in the Copy section. */
export function useTaskActions() {
  const store = useStore();
  const toast = useToast();

  const toggle = useCallback(
    (task: Task) => {
      // Members tick only their own tasks; admins can tick anyone's.
      if (!store.canTick(task)) {
        const owner = store.memberById(task.assigneeId);
        if (owner) toast({ message: copy.notYours(owner.name) });
        return;
      }
      if (task.doneAt) {
        store.uncomplete(task.id);
        toast({ message: copy.undoneToast });
        return;
      }
      store.complete(task.id);
      const mineLeft = todaysTasks(store.tasks).filter((t) => t.assigneeId === store.meId && !t.doneAt && t.id !== task.id);
      const wasMine = task.assigneeId === store.meId || task.assigneeId === null;
      toast({
        message: wasMine && mineLeft.length === 0 ? copy.allDoneToast : copy.doneToast(task.title),
        action: { label: copy.undo, onPress: () => store.uncomplete(task.id) },
      });
    },
    [store, toast],
  );

  return { toggle, canTick: store.canTick };
}
