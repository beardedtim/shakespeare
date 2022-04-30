import { setTimeout } from "timers/promises";
import { Actor } from "@app/Actor";
import { IntervalInbox } from "@app/Inbox";

const main = async () => {
  const actor = new Actor<number>({
    inbox: new IntervalInbox(),
    process: ({ payload }) => {
      console.log("Received payload", payload);
    },
  });

  // start the actor up
  await actor.start();

  // wait for about what it
  // takes to print 100 times
  await setTimeout(1030);

  // stop the actor
  await actor.stop();
};

main();
