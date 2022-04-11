import { joystreamBlue } from '../../config'
import { formatBalance } from '@polkadot/util';
import { EventRecord } from '@polkadot/types/interfaces';
import Discord from 'discord.js';
import { Membership } from '@joystream/types/augment-codec/all';
import { OpeningId, Opening, ApplicationId, Application } from "@joystream/types/working-group";
import { U128 } from "@polkadot/types";
import { Stake } from '@joystream/types/stake';
import { RewardRelationship } from '@joystream/types/recurring-rewards';



export const getMintCapacityChangedEmbed = (minted: number, mint: U128, blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed()
        .setTitle(`💰 💵 💸 💴 💶 ${formatBalance(minted, { withUnit: 'JOY' })} minted to the Treasury 💰 💵 💸 💴 💶 `)
        .addFields(
            { name: 'Balance', value: formatBalance(mint, { withUnit: 'JOY' }), inline: true },
        ), blockNumber, event );
}

export const getOpeningAddedEmbed = (id: OpeningId, opening: any, openingObject: Opening, blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed()
        .setTitle(`⛩ ${opening.headline} ⛩`)
        .setDescription(opening.job.description)
        .addFields(
            { name: 'ID', value: id.toString(), inline: true },
            { name: 'Reward', value: openingObject.reward_per_block.unwrapOr(0).toString(), inline: true },
            { name: 'Application Stake', value: openingObject.creation_stake.toString(), inline: true },
            { name: 'Role Stake', value: openingObject.stake_policy.stake_amount.toString(), inline: true },
            { name: 'Created By', value: opening.creator.membership.handle, inline: true },
        ), blockNumber, event );
}

export const getOpeningFilledEmbed = (opening: any, member: Membership, blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed().setTitle(`🎉 🥳 👏🏻 ${member.handle_hash.toString()} was hired as ${opening.job.title} 🎉 🥳 👏🏻`), blockNumber, event );
}

export const getAppliedOnOpeningEmbed = (applicationId: ApplicationId, application: Application, 
    openingText: any, hiringApplicationText: any, applicant: Membership, blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed()
        .setTitle(`🏛 ${applicant.handle_hash.toString()} applied to opening ${openingText.job.title}`)
        .setDescription(hiringApplicationText['About you']['What makes you a good fit for the job?'] || 'No description provided by applicant')
        .addFields(
            { name: 'Application ID', value: applicationId.toString(), inline: true},
            { name: 'Opening', value:  openingText.headline, inline: true},
            { name: 'Applicant', value: `[${applicant.handle_hash.toString()}] ${hiringApplicationText['About you']['Your name']}`, inline: true},
        ), blockNumber, event );
}


export const getWorkerRewardAmountUpdatedEmbed = (reward: RewardRelationship, member: Membership, 
    blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed()
        .setTitle(`💰💰💰 Salary of ${member.handle_hash.toString()} updated`)
        .addFields(
            { name: 'Salary', value: formatBalance(reward.amount_per_payout, { withUnit: 'JOY' }), inline: true },
            { name: 'Payout Frequency', value: reward.payout_interval + "", inline: true },
        ), blockNumber, event );
}

export const getLeaderSetEmbed = (member: Membership, blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed().setTitle(`🏛 ${member.handle_hash.toString()} is a new Lead`), blockNumber, event );
}

export const getLeaderUnsetEmbed = (blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed().setTitle(`🏛 Leader was unset`), blockNumber, event );
}

export const getWorkerTerminatedEmbed = (member: Membership, reason: string,
    blockNumber: number, event: EventRecord): Discord.MessageEmbed => {
    return getWorkerExitedOrTerminatedEmbed('been terminated', member, reason, blockNumber, event);
}

export const getWorkerExitedEmbed = (member: Membership, reason: string,
    blockNumber: number, event: EventRecord): Discord.MessageEmbed => {
    return getWorkerExitedOrTerminatedEmbed('exited', member, reason, blockNumber, event);
}

export const getWorkerExitedOrTerminatedEmbed = (action: string, member: Membership, reason: string,
    blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed()
        .setTitle(`🏛 Worker ${member.handle_hash.toString()} has ${action}`)
        .addFields(
            { name: 'Reason', value: reason, inline: true },
        ), blockNumber, event );
}

export const getApplicationTerminatedEmbed = (applicationId: ApplicationId, application: Application, member: Membership,
    blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return getApplicationTerminatedOrWithdrawEmbed("terminated", applicationId, application, member, blockNumber, event);
}

export const getApplicationWithdrawnEmbed = (applicationId: ApplicationId, application: Application, member: Membership,
    blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return getApplicationTerminatedOrWithdrawEmbed("withdrawn", applicationId, application, member, blockNumber, event);
}

export const getApplicationTerminatedOrWithdrawEmbed = (action: string, applicationId: ApplicationId, application: Application, member: Membership,
    blockNumber: number, event: EventRecord): Discord.MessageEmbed => {

    return addCommonProperties(new Discord.MessageEmbed()
        .setTitle(`🏛 Application of ${member.handle_hash.toString()} ${action}`)
        .addFields(
            { name: 'Application ID', value: applicationId.toString(), inline: true },
            { name: 'Opening ID', value: application.opening_id.toString(), inline: true },
        ), blockNumber, event );
}

export const getStakeUpdatedEmbed = (stake: Stake | null, member: Membership, action: string, blockNumber: number, event: EventRecord): Discord.MessageEmbed => {
    
    return addCommonProperties(new Discord.MessageEmbed()
        .setTitle(`💰💰💰 ${member.handle_hash.toString()}'s stake has been ${action}`)
        .addFields(
            { name: 'Stake', value: stake ? formatBalance(stake.value.toString(), { withUnit: 'JOY' }) : 'Not Set', inline: true }
        ), blockNumber, event );
}

const addCommonProperties = (embed: Discord.MessageEmbed, blockNumber: number, event: EventRecord) => {
    return embed.addFields(
        { name: 'Block', value: blockNumber + "", inline: true },
        { name: 'Tx', value: event.hash.toString(), inline: true },
    )
    .setColor(joystreamBlue)
    .setTimestamp();
}