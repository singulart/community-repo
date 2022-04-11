import Discord, { Intents } from "discord.js";
import { ApiPromise } from "@polkadot/api";
import { EventRecord } from "@polkadot/types/interfaces";
import { wsLocation } from "../../config";
import { connectApi, getBlockHash, getEvents } from "../lib/api";
import { getDiscordChannels } from "../util";
import { DiscordChannels } from "../types";
import { processGroupEvents } from "./";

const eventsMapping = {
  BudgetRefill: 28800,
  BudgetSet: 978,
  BudgetUpdated: 103053,
  OpeningFilled: 74353,
  OpeningAdded: 43286,
  OpeningAdded2: 125834,
  OpeningCancelled: 44492,
  WorkerRewardAmountUpdated: 112393,
  WorkerRewardAmountUpdated2: 117500,
  WorkerRoleAccountUpdated: 44513,
  RewardPayment: 57600,
  NewMissedRewardLevelReached: 57640,
  AppliedOnOpening: 43405,
  AppliedOnOpening2: 83269,
  // StakeIncreased: 4264798,
  // StakeDecreased: 4264862,
//  BeganApplicationReview: 4276739,
// TerminatedLeader: 4282370,
  LeaderSet: 45047,
  // StakeSlashed: 4908750,
  // TerminatedWorker: 4908750
};

const discordBotToken = process.env.TOKEN || undefined; // environment variable TOKEN must be set

const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS] });
client.login(discordBotToken).then(async () => {
  console.log("Bot logged in successfully");
  client.once("ready", async () => {
    console.log('Discord.js client ready');
    const channels: DiscordChannels = await getDiscordChannels(client);
    const api: ApiPromise = await connectApi(wsLocation);
    await api.isReady;
    Object.values(eventsMapping).forEach((block: number) =>
      getBlockHash(api, block).then((hash) =>
        getEvents(api, hash).then((events: EventRecord[]) =>
          processGroupEvents(api, block, hash, events, channels)
        )
      )
    );
  });
});
