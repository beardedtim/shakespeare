import { Subscription } from "rxjs";
import { InboxInterface } from "@app/Inbox";

export interface ActorMessage<MessageType> {
  payload: MessageType;
  self: Actor<MessageType>;
}

export type CouldNotCareLess = any;

export type ActorMessageProcessor<MessageType> = (
  message: ActorMessage<MessageType>
) => CouldNotCareLess;

export interface ActorConfig<MessageType, Repository> {
  inbox: InboxInterface<MessageType>;
  process: ActorMessageProcessor<MessageType>;
  repository?: Repository;
}
const noopRepository = () => ({});

export interface ActorInterface<MessageType, Repository> {
  data: Repository;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  send: (message: MessageType) => Promise<void>;
}

/**
 *
 * https://en.wikipedia.org/wiki/Actor_model
 *
 * In response to a message it receives, an actor can:
 *  make local decisions,
 *  create more actors,
 *  send more messages,
 *  and determine how to respond to the next message received (AKA keep local state)
 *
 *  Actors may modify their own private state, but can only
 *  affect each other indirectly through messaging
 *  (removing the need for lock-based synchronization).
 *
 *
 * ...
 *
 * Its development was "motivated by the prospect of highly parallel
 * computing machines consisting of dozens, hundreds, or even thousands
 * of independent microprocessors, each with its own local memory and
 * communications processor, communicating via a high-performance communications
 * network."
 *
 */
export class Actor<MessageType = any, Repository = any>
  implements ActorInterface<MessageType, Repository>
{
  #inbox: InboxInterface<MessageType>;
  #processor: ActorMessageProcessor<MessageType>;
  #internalMessageSubscription?: Subscription;
  #repository: Repository;

  constructor(config: ActorConfig<MessageType, Repository>) {
    this.#inbox = config.inbox;
    this.#processor = config.process;
    this.#repository = config.repository ?? (noopRepository() as Repository);
  }

  get data() {
    return this.#repository;
  }

  #processMessage(message: MessageType): Promise<void> {
    return this.#processor({
      payload: message,
      self: this,
    });
  }

  async start() {
    if (!this.#internalMessageSubscription) {
      await this.#inbox.connect();

      this.#internalMessageSubscription = this.#inbox.message$.subscribe(
        this.send.bind(this)
      );
    }
  }

  async stop() {
    await this.#inbox.disconnect();

    if (this.#internalMessageSubscription) {
      this.#internalMessageSubscription.unsubscribe();
    }
  }

  async send(message: MessageType) {
    return this.#processMessage(message);
  }
}

export default Actor;
