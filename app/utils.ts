import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";
import { VercelKV } from "@vercel/kv";

export const generateMatches = async (kv: VercelKV, week: number) => {
    const rsvpSet = `rsvp-week-${week}`;
    const matchesSet = `rsvp-week-${week}-matches`;

    // Get all members of the rsvp set
    const rsvpObjects: { fid: number, fname: string, buildrank: number, matched: boolean }[] = await kv.smembers(rsvpSet);
    console.log('generateMatches rsvpObjects', rsvpObjects);

    // shuffle all registered users by buildrank in descending order
    const shuffledRsvpObjects = rsvpObjects.sort((a, b) => b.buildrank - a.buildrank);

    // Create pairs and add them to the matches set
    for (let i = 0; i < Math.floor(shuffledRsvpObjects.length / 2); i++) {
      const fidOne = shuffledRsvpObjects[i].fid;
      const fidTwo = shuffledRsvpObjects[shuffledRsvpObjects.length - 1 - i].fid;

        console.log('generateMatches fidOne', fidOne, ' fidTwo ', fidTwo);

        if (fidTwo) {
            const match = {
                fidOne,
                fidTwo,
                published: false
            };

            console.log('adding to matchesSet', match)
            await kv.sadd(matchesSet, JSON.stringify(match));

            // await kv.srem(rsvpSet, JSON.stringify({ fid: fidOne, fname: shuffledRsvpObjects[i].fname, matched: true }));
            // await kv.srem(rsvpSet, JSON.stringify({ fid: fidTwo, fname: shuffledRsvpObjects[i+1].fname, matched: true }));

            console.log('casting match');
            publishCast(`Matched @${shuffledRsvpObjects[i].fname} and @${shuffledRsvpObjects[i+1].fname} - please coordinate to meet.`);
        }
    }
};

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

/**
 * Function to publish a message (cast) using neynarClient.
 * @param msg - The message to be published.
 */
export const publishCast = async (msg: string) => {
  try {
    // Using the neynarClient to publish the cast.
    // await neynarClient.publishCast(process.env.SIGNER_UUID!, msg, { channelId:"matchmaker" });
    await neynarClient.publishCast(process.env.SIGNER_UUID!, msg);
    console.log("Cast published successfully");
  } catch (err) {
    // Error handling, checking if it's an API response error.
    if (isApiErrorResponse(err)) {
      console.log(err.response.data);
    } else console.log(err);
  }
};

const neynarOptions = {
    method: 'GET',
    headers: { accept: 'application/json', api_key: process.env.NEYNAR_API_KEY! }
};

export async function getUser(fid: number): Promise<User | null> {
    let reqUser = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, neynarOptions);
    let user: User | undefined;
    const response = await reqUser.json();
    console.log('getUsers response', response);
    const users = response.users;
    if (users.length > 0) {
        return user = users[0];
    }
    return null;
}

export type BuildStats = {
    id: string;
    wallet: string;
    build_score: number;
    build_budget: number;
    rank: number;
    nominations_received: number;
    nominations_given: number;
};

export type User = {
    object: string;
    fid: number;
    username: string;
    display_name: string;
    custody_address: string;
    pfp_url: string;
    profile: {
        bio: {
            text: string;
            mentioned_profiles: string[];
        };
    };
    follower_count: number;
    following_count: number;
    verifications: string[];
    verified_addresses: {
        eth_addresses: string[];
        sol_addresses: string[];
    };
    active_status: string;
    power_badge: boolean;
    viewer_context: {
        following: boolean;
        followed_by: boolean;
    };
};