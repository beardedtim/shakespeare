import { Log } from "@app/Shared";
import { Actor } from "@app/Actor";
import { KafkaInbox } from "@app/Inboxes/Kafka";

const main = async () => {
  const actor = new Actor({
    inbox: new KafkaInbox({
      connection: {
        clientId: "example-kafka-client",
        brokers: ["broker:1", "broker:2"],
      },
      consumer: {
        groupId: "some-group-id",
        topic: "some-topic",
        fromBeginning: false,
      },
    }),
    process: ({ payload, self }) => {
      Log.trace({ payload, self }, "Working on my night moves");
    },
  });

  await actor.start();
};

main();
