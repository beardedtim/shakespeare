import test from "ava";
import { setTimeout } from "timers/promises";
import { IntervalInbox } from "./Inbox";

test("emits an event about once per timeout", async (assert) => {
  const plan = 2;
  const timeout = 500;
  const inbox = new IntervalInbox(timeout);

  assert.plan(plan);

  inbox.message$.subscribe(() => {
    assert.pass("We got a message!");
  });

  await inbox.connect();

  // wait for it to run at least twice
  // we need to give it a buffer because
  await setTimeout(timeout * plan + timeout / 3);
});
