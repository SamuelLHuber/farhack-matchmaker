/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

import { kv } from "@vercel/kv";
import { getUser } from '@/app/utils'

const appName = 'Coffee';
let week = 20; //TODO: get based on date

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
          You are rsvp'd @{user?.username}
        </div>
      </div>
    ),
    intents: [
      <Button action='/'>Home</Button>
    ]
  });
});



app.frame('/mate', async (c) => {
  let user = await getUser(c.frameData?.fid!);

  if (!user?.power_badge) { return c.error({ message: 'Sorry power badge gated for now.' }) }

  

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
          You are matched with @{user?.username}
        </div>
      </div>
    ),
    intents: [
      <Button action='/'>Home</Button>, // TODO: change to cast intent reaching out to the user
      <Button.AddCastAction action='/permalink'>Add</Button.AddCastAction>,
    ]
  });
});

app.castAction('/permalink', (c) => {
  return c.frame({ path: '/' })
},
  { name: appName, icon: 'heart' });

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)