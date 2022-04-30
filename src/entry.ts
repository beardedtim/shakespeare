import { InboxInterface } from "@app/Inbox";
import { Subject } from "rxjs";
import { Log } from "@app/Shared";

/**
 * RMQ Inbox
 */
class RMQInbox<MessageType = any> implements InboxInterface<MessageType> {
  message$: Subject<MessageType>;

  constructor() {
    this.message$ = new Subject<MessageType>();
  }

  connect() {}

  disconnect() {}
}

const main = async () => {
  Log.trace("Started");
  new RMQInbox();
};

main();
