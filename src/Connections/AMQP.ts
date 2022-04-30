import {
  Connection,
  ConnectionOptions,
  Receiver as AMQPReceiver,
  EventContext,
  ReceiverEvents,
  Sender as AMQPSender,
  AwaitableSender,
  AwaitableSenderOptions,
} from "rhea-promise";
import { randomUUID } from "crypto";

export type ConnectionConfig = ConnectionOptions;

export interface AMQPMetadata {
  /**
   * the value you want to use as the Name
   * of the Sender for the messages sent
   * from this connection
   */
  name: string;
  /**
   * the value you want to use as the
   * target.address
   */
  address: string;
  /**
   * Whether sent messages should be automatically settled once the peer settles them
   *
   * defaults true
   */
  autosettle: boolean;
  /**
   * if we should await sending of the messages or assume it all works
   *
   * defaults true
   */
  await: boolean;
  /**
   * if await true, awaits this long for confirmation
   *
   * in seconds
   *
   * defaults 3
   */
  awaitTimeout: number;
}

export interface AMQPConnectionConfig {
  connection: ConnectionConfig;
  metadata?: AMQPMetadata;
}

export class AMQPConnection {
  connection: Connection;

  constructor(config: AMQPConnectionConfig) {
    this.connection = new Connection(config.connection);
  }

  connect() {
    return this.connection.open();
  }

  disconnect() {
    return this.connection.close();
  }
}

export interface ReceiverConfig {
  connection: AMQPConnection | ConnectionConfig;
  name: string;
  address: string;
  process: (msg: EventContext) => unknown;
  error?: (msg: EventContext) => unknown;
  open?: (msg: EventContext) => unknown;
  close?: (msg: EventContext) => unknown;
}

export interface SenderConfig {
  connection: AMQPConnection | ConnectionConfig;
  name: string;
  address: string;
  await?: boolean;
  awaitTimeout?: number;
  process: (msg: EventContext) => unknown;
  error?: (msg: EventContext) => unknown;
  open?: (msg: EventContext) => unknown;
  close?: (msg: EventContext) => unknown;
}

export type EventHandler = (msg: EventContext) => unknown;

export class BaseAQMPWrapper {
  connection: AMQPConnection;
  metadata: {
    name: string;
    address: string;
  };

  errorHandler: EventHandler;
  openHandler: EventHandler;
  closeHandler: EventHandler;

  constructor({
    connection,
    handlers,
    metadata,
  }: {
    connection: AMQPConnection | ConnectionConfig;
    handlers: {
      error?: EventHandler;
      open?: EventHandler;
      close?: EventHandler;
    };
    metadata: { name: string; address: string };
  }) {
    const noop = () => {};
    this.metadata = metadata;
    this.connection =
      connection instanceof AMQPConnection
        ? connection
        : new AMQPConnection({ connection });

    this.openHandler = handlers.open ?? noop;
    this.closeHandler = handlers.close ?? noop;
    this.errorHandler = handlers.error ?? noop;
  }

  async disconnect() {
    await this.connection.disconnect();
  }
}

export class Receiver extends BaseAQMPWrapper {
  #receiver?: Promise<AMQPReceiver>;
  #processor: (msg: EventContext) => unknown;

  constructor(config: ReceiverConfig) {
    super({
      connection: config.connection,
      handlers: {
        open: config.open,
        close: config.close,
        error: config.error,
      },
      metadata: {
        name: config.name,
        address: config.address,
      },
    });

    this.#processor = config.process;
  }

  async connect() {
    await this.connection.connect();

    this.#receiver = this.connection.connection.createReceiver({
      name: this.metadata.name,
      source: {
        address: this.metadata.address,
      },
    });

    await this.#setupReceiver();
  }

  async #setupReceiver() {
    const receiver = await this.#receiver;

    if (!receiver) {
      throw new TypeError(
        `Expected receiver to be of type AMQPReceiver, got ${typeof receiver} instead. Did you call connect first?`
      );
    }

    receiver
      .on(ReceiverEvents.receiverOpen, this.openHandler)
      .on(ReceiverEvents.receiverClose, this.closeHandler)
      .on(ReceiverEvents.message, this.#processor)
      .on(ReceiverEvents.receiverError, this.errorHandler);
  }
}

export class Sender extends BaseAQMPWrapper {
  #sender?: Promise<AwaitableSender | AMQPSender>;

  #await: boolean;
  #timeout: number;

  constructor(config: SenderConfig) {
    super({
      connection: config.connection,
      handlers: {
        open: config.open,
        close: config.close,
        error: config.error,
      },
      metadata: {
        name: config.name,
        address: config.address,
      },
    });

    this.#await = config.await ?? true;
    this.#timeout = config.awaitTimeout ?? 10;
  }

  async connect() {
    await this.connection.connect();

    if (this.#await) {
      this.#sender = this.connection.connection.createAwaitableSender({
        name: this.metadata.name,
        target: {
          address: this.metadata.address,
        },
        sendTimeoutInSeconds: this.#timeout,
      } as AwaitableSenderOptions);
    } else {
      this.#sender = this.connection.connection.createSender({
        name: this.metadata.name,
        target: {
          address: this.metadata.address,
        },
      });
    }
  }

  send(msg: any) {
    if (this.#sender) {
      return this.#sender.then((sender) =>
        sender.send({
          message_id: randomUUID({ disableEntropyCache: true }),
          body: msg,
        })
      );
    }
  }
}

export default AMQPConnection;
