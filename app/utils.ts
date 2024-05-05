const neynarOptions = {
    method: 'GET',
    headers: { accept: 'application/json', api_key: process.env.NEYNAR_API_KEY! }
};

export async function getUser(fid: number): Promise<User | null> {
    let reqUser = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, neynarOptions);
    let user: User | undefined;
    const response = await reqUser.json();
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