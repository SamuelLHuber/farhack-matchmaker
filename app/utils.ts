import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";
import { VercelKV } from "@vercel/kv";

export const generateMatches = async (kv: VercelKV, week: number) => {
    const rsvpSet = `rsvp-week-${week}`;
    const matchesSet = `rsvp-week-${week}-matches`;

    // Get all members of the rsvp set
    const rsvpMembers = await kv.smembers(rsvpSet);

    // Convert members to an array of objects
    const rsvpObjects: { fid: number, fname: string, matched: boolean }[] = rsvpMembers.map((member: string) => JSON.parse(member) as { fid: number, fname: string, matched: boolean });

    // Shuffle the array of objects
    // You can do way fancier match making here
    // based on FID lookups to profiles one can take location (set in Warpcast), channel data, cast data, onchain data and more into account
    const shuffledRsvpObjects = rsvpObjects.sort(() => Math.random() - 0.5); 

    // Create pairs and add them to the matches set
    for (let i = 0; i < shuffledRsvpObjects.length; i += 2) {
        const fidOne = shuffledRsvpObjects[i].fid;
        const fidTwo = i + 1 < shuffledRsvpObjects.length ? shuffledRsvpObjects[i + 1].fid : null;

        if (fidTwo) {
            const match = {
                fidOne,
                fidTwo,
                published: false
            };

            await kv.sadd(matchesSet, JSON.stringify(match));

            await kv.srem(rsvpSet, JSON.stringify({ fid: fidOne, fname: shuffledRsvpObjects[i].fname, matched: true }));
            await kv.srem(rsvpSet, JSON.stringify({ fid: fidTwo, fname: shuffledRsvpObjects[i+1].fname, matched: true }));

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
        user = users[0];
    }
    return null;
}

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