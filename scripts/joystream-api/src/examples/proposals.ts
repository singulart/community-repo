import { WsProvider, ApiPromise } from "@polkadot/api";
import { types } from "@joystream/types";
import {
  Active,
  Approved,
  ExecutionFailed,
  Finalized,
  Proposal,
  ProposalDetails,
  ProposalId,
} from "@joystream/types/proposals";
import { StorageKey, Vec } from "@polkadot/types";
import { Membership } from "@joystream/types/members";
// import { Stake, Staked, StakeId } from "@joystream/types/stake";
import { AnyJson } from "@polkadot/types/types";

interface ProposalOverview {
  id: number;
  type: string;
  title: string;
  createdBy: [number, string];
  stakeId: number;
  stake: number;
  created: number;
  status: string;
  finalizedAt?: number;
  result?: string;
  feePaid?: number;
  executionStatus?: string;
  executeAt?: number;
  voteResult?: AnyJson;
  execution?: AnyJson;
}

async function main() {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider("ws://127.0.0.1:9944");

  //If you want to play around on our staging network, go ahead and connect to this staging network instead.
  //const provider = new WsProvider('wss://testnet-rpc-2-singapore.joystream.org');

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider, types });

  const allProposals: ProposalOverview[] = [];

  // get all proposalIds
  // sort them by id
  const proposalKeys = await api.query.proposalsEngine.proposals.keys();
  const proposalIds = proposalKeys.map(
    ({ args: [proposalId] }) => proposalId
  ) as Vec<ProposalId>;
  proposalIds.sort((a, b) => +a - +b);
  console.log("number of proposals", proposalIds.length);

  // get all stakeIds associated with proposalIds
  const stakeIdOfProposalId =
    (await api.query.proposalsEngine.stakesProposals.keys()) as StorageKey[];
  const stakeIdsOfProposalIds = stakeIdOfProposalId.map(
    ({ args: [stakeId] }) => stakeId
  ) as Vec<StakeId>;
  stakeIdsOfProposalIds.sort((a, b) => +a - +b);
  console.log("number of stakeIdsOfProposalIds:", stakeIdsOfProposalIds.length);

  for (let id of proposalIds) {
    const proposal = (await api.query.proposalsEngine.proposals(
      id
    )) as Proposal;
    const proposerHandle = (
      (await api.query.members.membershipById(
        proposal.proposerId
      )) as Membership
    ).handle.toString();
    const proposalStatus = proposal.status.value;
    const proposalDetails =
      (await api.query.proposalsCodex.proposalDetailsByProposalId(
        id
      )) as ProposalDetails;
    let stakeId = stakeIdsOfProposalIds[proposalIds.indexOf(id)];
    let stake = 0;
    if (
      ((await api.query.proposalsEngine.stakesProposals(
        stakeId
      )) as ProposalId) === id
    ) {
      const blockHash = await api.rpc.chain.getBlockHash(proposal.createdAt);
      const proposalStake = (await api.query.stake.stakes.at(
        blockHash,
        stakeId
      )) as Stake;
      if (proposalStake.staking_status.isOfType('Staked')) {
        stake += Number((proposalStake.staking_status.asType('Staked') as Staked).staked_amount);
      }
    }
    const proposalData: ProposalOverview = {
      id: +id,
      type: proposalDetails.type.toString(),
      title: Buffer.from(proposal.title.toString().substr(2), 'hex').toString(),
      createdBy: [+proposal.proposerId, proposerHandle],
      stakeId: +stakeId,
      stake,
      created: +proposal.createdAt,
      status: proposal.status.value.toString(),
    };
    // these proposals will have an annoyngly large 'execution'
    if (
      proposalDetails.type != "Text" &&
      proposalDetails.type != "RuntimeUpgrade"
    ) {
      proposalData.execution = proposalDetails.value.toHuman();
    }
    // check if the proposal is "Active"
    if (proposalStatus instanceof Active) {
      proposalData.status = proposalStatus.toString();
    } else {
      // There really isn't any other options here...
      if (proposalStatus instanceof Finalized) {
        proposalData.status = proposalStatus.proposalStatus.type;
        proposalData.finalizedAt = +proposalStatus.finalizedAt;
        proposalData.voteResult = proposal.votingResults.toHuman();
        const proposalResult = proposalStatus.proposalStatus.value;
        // check if the proposal is "Approved"
        if (proposalResult instanceof Approved) {
          proposalData.feePaid = 0;
          const gracePeriod = +proposal.parameters.gracePeriod;
          proposalData.executeAt = +proposalStatus.finalizedAt + gracePeriod;
          proposalData.executionStatus = proposalResult.type;
          // "Executed" and "PendingExecution" works differently than "ExecutionFailed"
          // the latter will have some information on what went wrong
          if (proposalResult.isOfType("Executed")) {
          } else if (proposalResult.isOfType("PendingExecution")) {
          } else if (proposalResult.value instanceof ExecutionFailed) {
            proposalData.executionStatus =
              proposalResult.type + `:` + proposalResult.value.error.toString();
          }
        } else {
          // If not finalized, but not approved, it must be one of...
          if (proposalStatus.proposalStatus.isOfType("Canceled")) {
            proposalData.feePaid = 10000;
          } else if (proposalStatus.proposalStatus.isOfType("Slashed")) {
            proposalData.feePaid = stake;
          } else if (proposalStatus.proposalStatus.isOfType("Vetoed")) {
            proposalData.feePaid = 0;
            // .. "Expired" or "Rejected", which are treated as the same.
          } else {
            proposalData.feePaid = 5000;
          }
        }
      }
    }
    allProposals.push(proposalData);
  }

  console.log("allProposals", JSON.stringify(allProposals, null, 4));

  await api.disconnect();
}

main();
