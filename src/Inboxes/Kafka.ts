import type { Observable } from "rxjs";
import type { Consumer, EachMessagePayload } from "kafkajs";

import { Kafka } from "kafkajs";
import { Log } from "@app/Shared";
import { Inbox, InboxInterface } from "@app/Inbox";
import { ConnectionOptions } from "tls";

interface KafkaInboxConfig {
  connection: {
    clientId: string;
    brokers: string[];
    ssl?: ConnectionOptions;
    /**
     * Timeout for initial connection 1000
     */
    connectionTimeout?: number;
    /**
     * Timeout for requesting to the kafka instance 3000
     */
    requestTimeout?: number;
    /**
     * Max number of retries per call 5
     */
    retries?: number;
    /**
     * Factor for jitter 0.2
     */
    factor?: number;
    /**
     * 	Initial value used to calculate the retry in milliseconds (This is still randomized following the randomization factor)
     *
     *  300
     */
    initialRetryTime?: number;
    /**
     * Maximum wait time for a retry in milliseconds 3000
     */
    maxRetryTime?: number;
  };
  consumer: {
    groupId: string;
    topic: string;
    fromBeginning?: boolean;
  };
}

export class KafkaInbox<MessageType> implements InboxInterface<MessageType> {
  message$: Observable<MessageType>;
  #inbox: Inbox<MessageType>;
  #log: typeof Log;
  #client: Kafka;
  #consumingClient?: Consumer;

  constructor(config: KafkaInboxConfig) {
    this.#log = Log.child({ name: "KafkaInbox" });
    this.#client = new Kafka(config.connection);

    this.#inbox = new Inbox<MessageType>({
      logger: this.#log.child({ sub: "inbox" }),
      connect: async (cb) => {
        this.#log.trace("Connecting to the underyling Kafka Connection");

        if (!this.#consumingClient) {
          this.#consumingClient = this.#client.consumer({
            groupId: config.consumer.groupId,
          });

          await this.#consumingClient.connect();

          await this.#consumingClient.subscribe({
            topic: config.consumer.topic,
            fromBeginning: config.consumer.fromBeginning,
          });

          await this.#consumingClient.run({
            eachMessage: async ({
              topic,
              partition,
              message,
            }: EachMessagePayload) => {
              const createdMessage = {
                topic,
                partition,
                message: {
                  offest: message.offset,
                  text: message.value?.toString(),
                },
              } as unknown as MessageType;

              return cb(createdMessage);
            },
          });
        } else {
          this.#log.debug(
            "Trying to connect to a consumer that is already connected"
          );
        }
      },
      disconnect: () => {
        this.#log.trace("Disconnecting from the underlying Kafka Connection");
      },
    });

    this.message$ = this.#inbox.message$;
  }

  async connect() {
    this.#log.trace("Connecting to the Kafka Inbox");

    await this.#inbox.connect();

    this.#log.trace("Connected to the Kafka Inbox");
  }

  async disconnect() {
    this.#log.trace("Disconnecting from the Kafka Inbox");

    await this.#inbox.disconnect();

    this.#log.trace("Disconnected from the Kafka Inbox");
  }
}

export default KafkaInbox;
