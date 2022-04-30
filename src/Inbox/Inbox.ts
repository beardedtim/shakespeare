import { Subject, Observable, tap } from "rxjs";

import { Log } from "@app/Shared";

export type InboxConnection<MessageType> = (
  connect: (message: MessageType) => void
) => void;

export interface InboxConfig<MessageType> {
  logger?: typeof Log;
  connect: InboxConnection<MessageType>;
  disconnect: () => void;
}

export interface InboxInterface<MessageType> {
  connect: () => void;
  disconnect: () => void;
  message$: Observable<MessageType>;
}

/**
 * An Actor's Inbox is where the messages that
 * are coming in are stored and pulled from.
 * This can be an in-memory, local, or over
 * network. This is just a wrapper for creating
 * the needed inbox Observable and all the wrappers
 * around it we may need.
 */
export class Inbox<MessageType> implements InboxInterface<MessageType> {
  #subject: Subject<MessageType>;
  message$: Observable<MessageType>;
  #log: typeof Log;

  #connectToSource: InboxConnection<MessageType>;
  #disconnectFromSource: () => void;

  constructor(config: InboxConfig<MessageType>) {
    this.#subject = new Subject<MessageType>();

    this.#log = config.logger ?? Log.child({ system: "inbox" });

    this.message$ = this.#subject.pipe(
      tap((message) => {
        this.#log.trace({ message }, "Incoming message being handled");
      })
    );

    this.#connectToSource = config.connect;
    this.#disconnectFromSource = config.disconnect;
  }

  /**
   * when we connect, we start producing
   * messages into the message$ Observable
   */
  connect() {
    this.#connectToSource((message) => this.#subject.next(message));
  }

  disconnect() {
    this.#disconnectFromSource();
  }
}

export class IntervalInbox<OutputType = any>
  implements InboxInterface<OutputType>
{
  #mapper: (input: number) => OutputType;
  #inbox: Inbox<OutputType>;
  #interval?: NodeJS.Timer;

  message$: Observable<OutputType>;

  /**
   * You can optiexport * from "./Inbox";ing more domain-specific without
   * having to re-write this
   */
  constructor(timeout = 10, optionalMapper?: (input: number) => OutputType) {
    this.#mapper = optionalMapper ?? ((input: any) => input);

    this.#inbox = new Inbox<OutputType>({
      connect: (cb) => {
        let i = 0;
        this.#interval = setInterval(() => {
          cb(this.#mapper(i++));
        }, timeout);
      },
      disconnect: () => {
        this.#interval && clearInterval(this.#interval);
      },
    });

    this.message$ = this.#inbox.message$;
  }

  connect() {
    return this.#inbox.connect();
  }

  disconnect() {
    return this.#inbox.disconnect();
  }
}

export default Inbox;
