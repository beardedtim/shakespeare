import { setTimeout } from "timers/promises";
import test from "ava";

import { Actor, ActorMessageProcessor } from "./Actor";
import { InboxInterface, IntervalInbox } from "@app/Inbox";

const testInbox = () => new IntervalInbox<number>();

const testActor = <Type = any>({
  process,
  inbox,
  repository,
}: {
  process: ActorMessageProcessor<Type>;
  inbox?: InboxInterface<Type>;
  repository?: any;
}) =>
  new Actor<Type>({
    process,
    // Tis a stupid language, TS.
    inbox: inbox ?? (testInbox() as any),
    repository,
  });

test("Consumes messages from the inbox until told to stop", async (assert) => {
  assert.plan(3);

  let count = 3;

  const actor = testActor({
    process: ({ self }) => {
      assert.pass(`We will see it ${count--} more times`);

      if (!count) {
        self.stop();
      }
    },
  });

  await actor.start();

  // these should go very fast
  // but we need to let it _go do it_
  //
  // sometimes 100 was failing with
  // only 1 test running
  //
  // 500 seemed to work all the time
  // and 300 failed with 2 running
  await setTimeout(500);

  await actor.stop();
});

test("passes the actual actor instance to the process function", async (assert) => {
  assert.plan(1);

  const actor = testActor({
    process: ({ self }) => {
      assert.is(self, actor, "The self is the actual actor value");
      self.stop();
    },
  });

  await actor.start();

  await setTimeout(100);
  await actor.stop();
});

test("passes the message$ value as payload", async (assert) => {
  assert.plan(1);

  const actor = testActor<number>({
    process: ({ self, payload }) => {
      assert.is(0, payload, "The inbox sends a zero");

      self.stop();
    },
  });

  await actor.start();

  await setTimeout(100);
  await actor.stop();
});

test("Actor has access to its repository via its data key in the processor", async (assert) => {
  assert.plan(1);
  const repo = {};
  const actor = testActor<number>({
    process: ({ self }) => {
      assert.is(
        repo,
        self.data,
        "The data value is the same value as the passed in repository"
      );

      self.stop();
    },
    repository: repo,
  });

  await actor.start();

  await setTimeout(100);

  await actor.stop();
});
