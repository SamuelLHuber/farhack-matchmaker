/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

import { kv } from "@vercel/kv";
import { User, generateMatches, getUser } from '@/app/utils'

const appName = 'Coffee';
let week = parseInt(process.env.WEEK!); //TODO: get based on date

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  hub: neynar({ apiKey: process.env.NEYNAR_API_KEY! }),
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/', (c) => {
  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background: 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Hi
        </div>
      </div>
    ),
    intents: [
      <Button action='/rsvp'>RSVP</Button>,
      <Button action='/mate'>Check</Button>,
    ],
  })
})

app.frame('/rsvp', async (c) => {
  let user = await getUser(c.frameData?.fid!);
  console.log('rsvp user', user)

  if (!user?.power_badge) { return c.error({ message: 'Sorry power badge gated for now.' }) }

  // get current calendar week
  let rsvp = { "fid": user?.fid, "fname": user?.username, "matched": false }
  if (await kv.sismember(`rsvp-week-${week}`, user?.fid)) {
    return c.error({ message: 'You are already rsvp\'d.' })
  }
  kv.sadd(`rsvp-week-${week}`, JSON.stringify(rsvp));

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background: 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          You are rsvp'd 
        </div>
      </div>
    ),
    intents: [
      <Button action='/'>Home</Button>,
      <Button.AddCastAction action='/permalink'>Add</Button.AddCastAction>,
    ]
  });
});



app.frame('/mate', async (c) => {
  let user = await getUser(c.frameData?.fid!);

  if (!user?.power_badge) { return c.error({ message: 'Sorry power badge gated for now.' }) }
  
  await generateMatches(kv, week); // run manually just once for the demo

  const matchesSet = `rsvp-week-${week}-matches`;

  // Get all members of the matches set
  const matchMembers: {fidOne: number, fidTwo: number, posted: boolean}[]= await kv.smembers(matchesSet);
  console.log('/mate matchMembers', matchMembers);

  // Find the match object that contains the given fid
  const matchData = matchMembers.find(member => {
    return member.fidOne === user.fid || member.fidTwo === user.fid;
  });

  if (matchData) {
    let match: User | null;
    console.log('/mate matchData', matchData);
    if (matchData.fidOne === user.fid) {
      match = await getUser(matchData.fidTwo);
    }
    else {
      match = await getUser(matchData.fidOne);
    }

    if (!match) {
      return c.error({ message: 'Error: getting match user data from store' })
    }

    return c.res({
      image: (
        <div
          style={{
            alignItems: 'center',
            background: 'black',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 60,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`You are matched with ${match.username}`}
          </div>
        </div>
      ),
      intents: [
        <Button action='/'>Home</Button>, // TODO: change to cast intent reaching out to the user
        <Button.AddCastAction action='/permalink'>Add</Button.AddCastAction>,
      ]
    });
  }


  return c.error({ message: 'Error: getting match data.' })
});

app.castAction('/permalink', (c) => {
  return c.frame({ path: '/' })
},
  { name: appName, icon: 'heart' });

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)