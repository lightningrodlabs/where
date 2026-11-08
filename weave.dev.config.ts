import { defineConfig } from '@theweave/cli';

/**
 * Moss dev config: `npm run tool-dev` (two agents) or `npm run tool-dev-1`.
 * The Tool UI is served by a live vite on `uiPort` (hot reload, source maps),
 * so only the happ needs rebuilding when the zomes change.
 */
export default defineConfig({
  toolCurations: [],
  groups: [
    {
      name: 'Lightning Rod Labs',
      networkSeed: '098rc1m-09384u-crm-29384u-cmkj',
      icon: {
        type: 'https',
        url: 'https://raw.githubusercontent.com/lightningrodlabs/moss/main/example/ui/tennis_club.png',
      },
      creatingAgent: {
        agentIdx: 1,
        agentProfile: {
          nickname: 'Alex',
          avatar: {
            type: 'https',
            url: 'https://raw.githubusercontent.com/lightningrodlabs/moss/main/example/ui/gaston.jpeg',
          },
        },
      },
      joiningAgents: [
        {
          agentIdx: 2,
          agentProfile: {
            nickname: 'Billy',
            avatar: {
              type: 'https',
              url: 'https://raw.githubusercontent.com/lightningrodlabs/moss/main/example/ui/marsupilami.jpeg',
            },
          },
        },
      ],
      applets: [
        {
          name: 'Where',
          instanceName: 'Where',
          registeringAgent: 1,
          joiningAgents: [2],
        },
      ],
    },
  ],
  applets: [
    {
      name: 'Where',
      subtitle: 'Group maps',
      description: 'Shared maps for groups to see the emergent "whereness" of each other.',
      icon: {
        type: 'filesystem',
        path: './moss-tool/icon.png',
      },
      source: {
        type: 'localhost',
        happPath: './artifacts/where.happ',
        uiPort: 1420,
      },
    },
  ],
});
